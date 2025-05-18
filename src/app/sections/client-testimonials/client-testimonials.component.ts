import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-client-testimonials',
  imports: [CommonModule],
  templateUrl: './client-testimonials.component.html',
  styleUrl: './client-testimonials.component.scss'
})
export class ClientTestimonialsComponent {
  testimonials = [
    {
      name: 'Rajesh Kumar',
      caseType: 'Civil Litigation',
      feedback: 'The legal team handled my case professionally and kept me informed throughout. Highly recommended!'
    },
    {
      name: 'Anjali Verma',
      caseType: 'Family Law',
      feedback: 'Supportive and knowledgeable lawyers who really care about their clients.'
    },
    {
      name: 'Imran Sheikh',
      caseType: 'Property Dispute',
      feedback: 'They resolved my long-standing dispute efficiently. Very grateful to MR Legal Associates.'
    }
  ];

}
