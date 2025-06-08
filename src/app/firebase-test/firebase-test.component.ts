import { Component, OnInit } from '@angular/core';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-firebase-test',
  imports: [CommonModule],
  templateUrl: './firebase-test.component.html',
  styleUrl: './firebase-test.component.scss'
})
export class FirebaseTestComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  testData: any[] = [];

  async ngOnInit() {
    await this.loadData();
  }

  async addTestData() {
    const testCollection = collection(this.firestore, 'test-data');
    await addDoc(testCollection, {
      name: 'Test entry ' + new Date().toLocaleTimeString()
    });
    await this.loadData();
  }

  async loadData() {
    const querySnapshot = await getDocs(collection(this.firestore, 'test-data'));
    this.testData = querySnapshot.docs.map(doc => doc.data());
  }
}
