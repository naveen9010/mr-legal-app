import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject, takeUntil } from 'rxjs';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  deleteDoc,
  doc,
  updateDoc
} from '@angular/fire/firestore';

export interface LawyerContact {
  id?: string;
  name: string;
  whatsappNumber: string;
  email?: string;
  organization?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ForwardJudgementRequest {
  summary: string;
  selectedLawyers: string[];
}

@Component({
  selector: 'app-forward-judgement',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatTabsModule,
    MatFormFieldModule
  ],
  templateUrl: './forward-judgement.component.html',
  styleUrl: './forward-judgement.component.scss'
})
export class ForwardJudgementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  lawyers: LawyerContact[] = [];
  selectedLawyers: string[] = [];
  isLoading = false;
  
  // Forms
  lawyerForm!: FormGroup;
  judgementForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadLawyers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.lawyerForm = this.fb.group({
      name: ['', Validators.required],
      whatsappNumber: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/)]],
      email: ['', Validators.email],
      organization: ['']
    });

    this.judgementForm = this.fb.group({
      summary: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  private loadLawyers(): void {
    const lawyersRef = collection(this.firestore, 'lawyer_contacts');
    collectionData(lawyersRef, { idField: 'id' }).subscribe((data) => {
      this.lawyers = (data as LawyerContact[]).filter(lawyer => lawyer.isActive !== false);
    });
  }

  async onAddLawyer(): Promise<void> {
    if (this.lawyerForm.valid) {
      this.isLoading = true;
      try {
        const lawyersRef = collection(this.firestore, 'lawyer_contacts');
        await addDoc(lawyersRef, {
          ...this.lawyerForm.value,
          isActive: true,
          createdAt: new Date().toISOString()
        });
        
        this.lawyerForm.reset();
        this.snackBar.open('Lawyer contact added successfully!', 'Close', { duration: 3000 });
      } catch (error) {
        console.error('Error adding lawyer:', error);
        this.snackBar.open('Error adding lawyer contact', 'Close', { duration: 3000 });
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onDeleteLawyer(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this lawyer contact?')) {
      try {
        const lawyerDocRef = doc(this.firestore, 'lawyer_contacts', id);
        await updateDoc(lawyerDocRef, { isActive: false });
        this.snackBar.open('Lawyer contact deleted successfully!', 'Close', { duration: 3000 });
      } catch (error) {
        console.error('Error deleting lawyer:', error);
        this.snackBar.open('Error deleting lawyer contact', 'Close', { duration: 3000 });
      }
    }
  }

  onLawyerSelectionChange(lawyerId: string, isSelected: boolean): void {
    if (isSelected) {
      this.selectedLawyers.push(lawyerId);
    } else {
      this.selectedLawyers = this.selectedLawyers.filter(id => id !== lawyerId);
    }
  }

  async onForwardJudgement(): Promise<void> {
    if (this.judgementForm.valid && this.selectedLawyers.length > 0) {
      this.isLoading = true;
      try {
        const judgementRef = collection(this.firestore, 'judgement_forwards');
        const selectedLawyerCount = this.selectedLawyers.length;
        const request: ForwardJudgementRequest = {
          summary: this.judgementForm.value.summary,
          selectedLawyers: this.selectedLawyers
        };

        await addDoc(judgementRef, {
          ...request,
          forwardedAt: new Date().toISOString()
        });
        
        this.judgementForm.reset();
        this.selectedLawyers = [];
        
        this.snackBar.open(`Judgement record saved for ${selectedLawyerCount} lawyer(s)!`, 'Close', { duration: 3000 });
      } catch (error) {
        console.error('Error forwarding judgement:', error);
        this.snackBar.open('Error saving judgement record', 'Close', { duration: 3000 });
      } finally {
        this.isLoading = false;
      }
    } else {
      this.snackBar.open('Please enter summary and select at least one lawyer', 'Close', { duration: 3000 });
    }
  }

  isLawyerSelected(lawyerId: string): boolean {
    return this.selectedLawyers.includes(lawyerId);
  }
}