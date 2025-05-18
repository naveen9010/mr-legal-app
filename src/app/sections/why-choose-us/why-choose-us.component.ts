import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import * as AOS from 'aos';

@Component({
  selector: 'app-why-choose-us',
  imports: [CommonModule],
  templateUrl: './why-choose-us.component.html',
  styleUrl: './why-choose-us.component.scss'
})
export class WhyChooseUsComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({ duration: 1000, once: true });
    }
  }

  highlights = [
    {
      title: 'Expert Legal Insight',
      description:
        'With over 25 years of courtroom experience, our strategies are tailored to win — built on precedent, precision, and preparation.'
    },
    {
      title: 'Client-Centered Strategy',
      description:
        'You’re not just a file number. We align our legal strategies with your unique goals and expectations, every step of the way.'
    },
    {
      title: 'Integrity & Transparency',
      description:
        'Clear communication. Honest advice. No surprises — just straight answers about your legal position.'
    }
  ];
}
