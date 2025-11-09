import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore'; // ✅ Firestore import
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-book-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatIconModule],
  templateUrl: './book-consultation.component.html',
  styleUrl: './book-consultation.component.scss'
})
export class BookConsultationComponent implements OnInit {
  formData = {
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    message: ''
  };

  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Check if there's a selected date and time in localStorage
    const selectedDate = localStorage.getItem('selectedConsultDate');
    const selectedTime = localStorage.getItem('selectedConsultTime');
    
    if (selectedDate && selectedTime) {
      // Set the form data
      this.formData.date = selectedDate;
      this.formData.time = selectedTime;
      
      // Clear the localStorage
      localStorage.removeItem('selectedConsultDate');
      localStorage.removeItem('selectedConsultTime');
      
      // Show a message to the user
      this.snackBar.open('Please complete the form to book your consultation', 'Close', {
        duration: 5000,
        panelClass: ['info-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }
  
  viewAvailableSlots(): void {
    // Navigate to the public calendar view
    this.router.navigate(['/available-slots']);
    
    // Show a message to the user
    this.snackBar.open('Select an available slot (green) for your consultation', 'Close', {
      duration: 5000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  async onSubmit(): Promise<void> {
    try {
      // Add consultation to Firestore
      // This will automatically trigger the Cloud Function to send a notification
      const docRef = await addDoc(collection(this.firestore, 'consultations'), {
        clientName: this.formData.name,
        email: this.formData.email,
        phone: this.formData.phone,
        consultDate: this.formData.date,
        consultTime: this.formData.time,
        message: this.formData.message,
        status: 'pending', // pending, accepted, declined
        createdAt: new Date()
      });

      // No need to send notification here as the Cloud Function will handle it
      // This prevents duplicate notifications

      // Show success message with professional banner
      this.snackBar.open('Consultation request submitted! Our team will contact you shortly.', 'Close', {
        duration: 6000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      
      this.formData = { name: '', email: '', phone: '', date: '', time: '', message: '' }; // Reset form

    } catch (error) {
      console.error('Error submitting consultation:', error);
      
      // Show error message with professional banner
      this.snackBar.open('Error submitting your consultation request. Please try again.', 'Close', {
        duration: 6000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }
}
