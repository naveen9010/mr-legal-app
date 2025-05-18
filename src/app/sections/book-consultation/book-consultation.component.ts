import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-consultation',
  imports: [CommonModule, FormsModule ],
  templateUrl: './book-consultation.component.html',
  styleUrl: './book-consultation.component.scss'
})
export class BookConsultationComponent {
  onSubmit() {
    alert('Consultation request submitted! Our team will contact you shortly.');
  }
}
