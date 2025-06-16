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
    MatIconModule
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

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    const hearingRef = collection(this.firestore, 'hearings');
    collectionData(hearingRef, { idField: 'id' }).subscribe((data) => {
      this.hearings.data = data;
      this.hearings.paginator = this.paginator;
      this.hearings.sort = this.sort;
    });
  }

  async addHearing() {
    if (!this.caseTitle || !this.hearingDate || !this.hearingTime) {
      alert('Case Title, Hearing Date, and Hearing Time are required.');
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
  }

  async markAsCompleted(hearingId: string) {
    const hearingDocRef = doc(this.firestore, 'hearings', hearingId);
    await updateDoc(hearingDocRef, { status: 'Completed' });
  }

  async deleteHearing(hearingId: string) {
    if (confirm('Are you sure you want to delete this hearing?')) {
      const hearingDocRef = doc(this.firestore, 'hearings', hearingId);
      await deleteDoc(hearingDocRef);
    }
  }
}
