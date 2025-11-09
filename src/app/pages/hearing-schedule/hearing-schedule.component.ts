import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CalendarService } from '../../services/calendar.service';
import { PremiumLoaderComponent } from '../../components/premium-loader/premium-loader.component';

@Component({
  selector: 'app-hearing-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    PremiumLoaderComponent
  ],
  templateUrl: './hearing-schedule.component.html',
  styleUrls: ['./hearing-schedule.component.scss']
})
export class HearingScheduleComponent implements OnInit {
  caseTitle = '';
  caseNumber = '';
  courtName = '';
  judgeName = '';
  clientName = '';
  opponentName = '';
  hearingDate = '';
  hearingTime = '';
  notes = '';
  status = 'Scheduled';
  isLoading = false;

  hearings = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [
    'caseTitle',
    'clientName',
    'hearingDate',
    'hearingTime',
    'status',
    'actions'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private firestore: Firestore,
    private calendarService: CalendarService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const hearingRef = collection(this.firestore, 'hearings');
    collectionData(hearingRef, { idField: 'id' }).subscribe((data) => {
      this.hearings.data = data;
      this.hearings.paginator = this.paginator;
      this.hearings.sort = this.sort;
    });
  }

  async addHearing() {
    this.isLoading = true;
    
    if (!this.caseTitle || !this.hearingDate || !this.hearingTime) {
      this.isLoading = false;
      this.snackBar.open('Case Title, Hearing Date, and Hearing Time are required.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    const hearingRef = collection(this.firestore, 'hearings');
    await addDoc(hearingRef, {
      caseTitle: this.caseTitle,
      caseNumber: this.caseNumber,
      courtName: this.courtName,
      judgeName: this.judgeName,
      clientName: this.clientName,
      opponentName: this.opponentName,
      hearingDate: this.hearingDate,
      hearingTime: this.hearingTime,
      notes: this.notes,
      status: this.status,
      createdAt: new Date().toISOString()
    });

    // Add the hearing to Google Calendar
    this.calendarService.createHearingEvent({
      caseTitle: this.caseTitle,
      caseNumber: this.caseNumber,
      courtName: this.courtName,
      judgeName: this.judgeName,
      clientName: this.clientName,
      hearingDate: this.hearingDate,
      hearingTime: this.hearingTime,
      notes: this.notes
    });

    // Show success message
    this.snackBar.open('Hearing added successfully!', 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    
    // Clear form
    this.caseTitle = '';
    this.caseNumber = '';
    this.courtName = '';
    this.judgeName = '';
    this.clientName = '';
    this.opponentName = '';
    this.hearingDate = '';
    this.hearingTime = '';
    this.notes = '';
    this.status = 'Scheduled';
    
    this.isLoading = false;
  }

  async markAsCompleted(hearingId: string) {
    this.isLoading = true;
    
    const hearingDocRef = doc(this.firestore, 'hearings', hearingId);
    await updateDoc(hearingDocRef, { status: 'Completed' });
    
    this.isLoading = false;
    
    this.snackBar.open('Hearing marked as completed', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  async deleteHearing(hearingId: string) {
    this.isLoading = true;
    
    // Open a professional dialog instead of using confirm()
    const dialogRef = this.dialog.open(DeleteHearingDialogComponent, {
      width: '350px',
      data: { hearingId }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const hearingDocRef = doc(this.firestore, 'hearings', hearingId);
        await deleteDoc(hearingDocRef);
        
        this.snackBar.open('Hearing deleted successfully', 'Close', {
          duration: 3000,
          panelClass: ['warning-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
      this.isLoading = false;
    });
  }
}

// Dialog component for confirming hearing deletion
@Component({
  selector: 'app-delete-hearing-dialog',
  template: `
    <h2 mat-dialog-title>Confirm Deletion</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete this hearing?</p>
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
export class DeleteHearingDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteHearingDialogComponent>
  ) {}
}
