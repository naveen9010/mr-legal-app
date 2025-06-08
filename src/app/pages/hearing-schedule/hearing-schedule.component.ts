import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-hearing-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hearing-schedule.component.html',
  styleUrls: ['./hearing-schedule.component.scss']
})
export class HearingScheduleComponent implements OnInit {
  caseTitle = '';
  hearingDate = '';
  notes = '';

  hearings$: Observable<any[]>;

  constructor(private firestore: Firestore) {
    const hearingRef = collection(this.firestore, 'hearings');
    this.hearings$ = collectionData(hearingRef, { idField: 'id' });
  }

  ngOnInit(): void {}

  async addHearing() {
    if (!this.caseTitle || !this.hearingDate) {
      alert('Case Title and Hearing Date are required.');
      return;
    }

    const hearingRef = collection(this.firestore, 'hearings');
    await addDoc(hearingRef, {
      caseTitle: this.caseTitle,
      hearingDate: this.hearingDate,
      notes: this.notes,
      createdAt: new Date().toISOString()
    });

    this.caseTitle = '';
    this.hearingDate = '';
    this.notes = '';
  }
}
