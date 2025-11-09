import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  deleteDoc,
  doc,
  updateDoc
} from '@angular/fire/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface PaymentRecord {
  id?: string;
  clientName: string;
  clientPhone?: string;
  caseTitle: string;
  caseNumber?: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentType: string;
  transactionReference?: string;
  totalCaseFee?: number;
  paymentNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-client-payment-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule
  ],
  templateUrl: './client-payment-details.component.html',
  styleUrls: ['./client-payment-details.component.scss']
})
export class ClientPaymentDetailsComponent implements OnInit {
  // Form fields
  clientName = '';
  clientPhone = '';
  caseTitle = '';
  caseNumber = '';
  paymentAmount: number | null = null;
  paymentDate = '';
  paymentMethod = 'Cash';
  paymentType = 'Initial Payment';
  transactionReference = '';
  totalCaseFee: number | null = null;
  paymentNotes = '';
  
  isLoading = false;
  editingPayment: PaymentRecord | null = null;

  payments = new MatTableDataSource<PaymentRecord>([]);
  displayedColumns: string[] = [
    'clientName',
    'caseTitle',
    'paymentAmount',
    'paymentDate',
    'paymentMethod',
    'paymentType',
    'actions'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  ngAfterViewInit(): void {
    this.payments.paginator = this.paginator;
    this.payments.sort = this.sort;
  }

  loadPayments(): void {
    const paymentRef = collection(this.firestore, 'client-payments');
    collectionData(paymentRef, { idField: 'id' }).subscribe((data) => {
      this.payments.data = data as PaymentRecord[];
      this.payments.paginator = this.paginator;
      this.payments.sort = this.sort;
    });
  }

  async addPayment(): Promise<void> {
    if (!this.validateForm()) return;

    this.isLoading = true;
    
    try {
      const paymentRef = collection(this.firestore, 'client-payments');
      const paymentData = {
        clientName: this.clientName,
        clientPhone: this.clientPhone || '',
        caseTitle: this.caseTitle,
        caseNumber: this.caseNumber || '',
        paymentAmount: this.paymentAmount,
        paymentDate: this.paymentDate,
        paymentMethod: this.paymentMethod,
        paymentType: this.paymentType,
        transactionReference: this.transactionReference || '',
        totalCaseFee: this.totalCaseFee || 0,
        paymentNotes: this.paymentNotes || '',
        createdAt: new Date().toISOString()
      };

      await addDoc(paymentRef, paymentData);
      this.showSuccessMessage('Payment record added successfully!');
      this.clearForm();
    } catch (error) {
      this.showErrorMessage('Error adding payment record. Please try again.');
      console.error('Error adding payment:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async updatePayment(): Promise<void> {
    if (!this.editingPayment || !this.validateForm()) return;

    this.isLoading = true;
    
    try {
      const paymentDocRef = doc(this.firestore, 'client-payments', this.editingPayment.id!);
      await updateDoc(paymentDocRef, {
        clientName: this.clientName,
        caseTitle: this.caseTitle,
        caseNumber: this.caseNumber || '',
        paymentAmount: this.paymentAmount,
        paymentDate: this.paymentDate,
        paymentMethod: this.paymentMethod,
        paymentType: this.paymentType,
        transactionReference: this.transactionReference || '',
        totalCaseFee: this.totalCaseFee || 0,
        paymentNotes: this.paymentNotes || '',
        updatedAt: new Date().toISOString()
      });

      this.showSuccessMessage('Payment record updated successfully!');
      this.clearForm();
      this.editingPayment = null;
    } catch (error) {
      this.showErrorMessage('Error updating payment record. Please try again.');
      console.error('Error updating payment:', error);
    } finally {
      this.isLoading = false;
    }
  }

  editPayment(payment: PaymentRecord): void {
    this.editingPayment = payment;
    this.clientName = payment.clientName;
    this.clientPhone = payment.clientPhone || '';
    this.caseTitle = payment.caseTitle;
    this.caseNumber = payment.caseNumber || '';
    this.paymentAmount = payment.paymentAmount;
    this.paymentDate = payment.paymentDate;
    this.paymentMethod = payment.paymentMethod;
    this.paymentType = payment.paymentType;
    this.transactionReference = payment.transactionReference || '';
    this.totalCaseFee = payment.totalCaseFee || null;
    this.paymentNotes = payment.paymentNotes || '';
  }

  cancelEdit(): void {
    this.editingPayment = null;
    this.clearForm();
  }

  async deletePayment(paymentId: string): Promise<void> {
    const dialogRef = this.dialog.open(DeletePaymentDialogComponent, {
      width: '350px',
      data: { paymentId }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.isLoading = true;
        try {
          const paymentDocRef = doc(this.firestore, 'client-payments', paymentId);
          await deleteDoc(paymentDocRef);
          this.showSuccessMessage('Payment record deleted successfully');
        } catch (error) {
          this.showErrorMessage('Error deleting payment record. Please try again.');
          console.error('Error deleting payment:', error);
        } finally {
          this.isLoading = false;
        }
      }
    });
  }

  viewPaymentDetails(payment: PaymentRecord): void {
    this.dialog.open(PaymentDetailsDialogComponent, {
      width: '500px',
      data: payment
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.payments.filter = filterValue.trim().toLowerCase();

    if (this.payments.paginator) {
      this.payments.paginator.firstPage();
    }
  }

  getTotalReceived(): number {
    return this.payments.data.reduce((total, payment) => {
      return payment.paymentType === 'Refund' 
        ? total - payment.paymentAmount 
        : total + payment.paymentAmount;
    }, 0);
  }

  getThisMonthTotal(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return this.payments.data
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      })
      .reduce((total, payment) => {
        return payment.paymentType === 'Refund' 
          ? total - payment.paymentAmount 
          : total + payment.paymentAmount;
      }, 0);
  }

  private validateForm(): boolean {
    if (!this.clientName || !this.caseTitle || !this.paymentAmount || !this.paymentDate) {
      this.showErrorMessage('Client Name, Case Title, Payment Amount, and Payment Date are required.');
      return false;
    }
    return true;
  }

  private clearForm(): void {
    this.clientName = '';
    this.clientPhone = '';
    this.caseTitle = '';
    this.caseNumber = '';
    this.paymentAmount = null;
    this.paymentDate = '';
    this.paymentMethod = 'Cash';
    this.paymentType = 'Initial Payment';
    this.transactionReference = '';
    this.totalCaseFee = null;
    this.paymentNotes = '';
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}

// Dialog component for confirming payment deletion
@Component({
  selector: 'app-delete-payment-dialog',
  template: `
    <h2 mat-dialog-title>Confirm Deletion</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete this payment record?</p>
      <p>This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ]
})
export class DeletePaymentDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeletePaymentDialogComponent>
  ) {}
}

// Dialog component for viewing payment details
@Component({
  selector: 'app-payment-details-dialog',
  template: `
    <h2 mat-dialog-title>Payment Details</h2>
    <mat-dialog-content class="payment-details">
      <div class="detail-row">
        <strong>Client Name:</strong>
        <span>{{ data.clientName }}</span>
      </div>
      <div class="detail-row">
        <strong>Case Title:</strong>
        <span>{{ data.caseTitle }}</span>
      </div>
      <div class="detail-row" *ngIf="data.caseNumber">
        <strong>Case Number:</strong>
        <span>{{ data.caseNumber }}</span>
      </div>
      <div class="detail-row">
        <strong>Payment Amount:</strong>
        <span class="amount">₹{{ data.paymentAmount | number:'1.2-2' }}</span>
      </div>
      <div class="detail-row">
        <strong>Payment Date:</strong>
        <span>{{ data.paymentDate | date:'fullDate' }}</span>
      </div>
      <div class="detail-row">
        <strong>Payment Method:</strong>
        <span>{{ data.paymentMethod }}</span>
      </div>
      <div class="detail-row">
        <strong>Payment Type:</strong>
        <span>{{ data.paymentType }}</span>
      </div>
      <div class="detail-row" *ngIf="data.transactionReference">
        <strong>Transaction Reference:</strong>
        <span>{{ data.transactionReference }}</span>
      </div>
      <div class="detail-row" *ngIf="data.totalCaseFee">
        <strong>Total Case Fee:</strong>
        <span class="amount">₹{{ data.totalCaseFee | number:'1.2-2' }}</span>
      </div>
      <div class="detail-row" *ngIf="data.paymentNotes">
        <strong>Notes:</strong>
        <span>{{ data.paymentNotes }}</span>
      </div>
      <div class="detail-row">
        <strong>Created At:</strong>
        <span>{{ data.createdAt | date:'medium' }}</span>
      </div>
      <div class="detail-row" *ngIf="data.updatedAt">
        <strong>Last Updated:</strong>
        <span>{{ data.updatedAt | date:'medium' }}</span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .payment-details {
      min-width: 400px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .amount {
      font-weight: bold;
      color: #2e7d32;
    }
    strong {
      color: #333;
      min-width: 150px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ]
})
export class PaymentDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PaymentDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentRecord
  ) {}
}