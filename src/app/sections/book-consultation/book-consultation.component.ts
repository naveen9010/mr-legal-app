import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore'; // ✅ Firestore import

@Component({
  selector: 'app-book-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule ],
  templateUrl: './book-consultation.component.html',
  styleUrl: './book-consultation.component.scss'
})
export class BookConsultationComponent {
  formData = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };

  constructor(private firestore: Firestore) {}

  async onSubmit() {
    try {
      await addDoc(collection(this.firestore, 'consultations'), {
        clientName: this.formData.name,
        email: this.formData.email,
        phone: this.formData.phone,
        message: this.formData.message,
        createdAt: new Date()
      });

      alert('Consultation request submitted! Our team will contact you shortly.');
      this.formData = { name: '', email: '', phone: '', message: '' }; // Reset form

    } catch (error) {
      console.error('Error submitting consultation:', error);
      alert('Error submitting your consultation request. Please try again.');
    }
  }
}
