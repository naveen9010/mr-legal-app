import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit {
  slides = [
    { quote: 'Empowering Justice, One Case at a Time.' },
    { quote: 'Protecting Your Rights with Integrity.' },
    { quote: 'Legal Solutions Tailored for You.' },
    { quote: 'Advocating with Passion and Purpose.' },
    { quote: 'Expertise. Experience. Excellence.' },
    { quote: 'Where Law Meets Loyalty.' }
  ];

  currentSlideIndex = 0;
  currentQuote = '';
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.startSlideShow();
    }
  }

  startSlideShow() {
    const current = this.slides[this.currentSlideIndex];
    this.showSlide(this.currentSlideIndex);
    this.typeText(current.quote, () => {
      setTimeout(() => {
        this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
        this.startSlideShow();
      }, 2000);
    });
  }

  showSlide(index: number) {
    this.currentSlideIndex = index;
  }

  typeText(text: string, callback: () => void) {
    this.currentQuote = '';
    let i = 0;
    const interval = setInterval(() => {
      this.currentQuote += text.charAt(i++);
      if (i >= text.length) {
        clearInterval(interval);
        callback();
      }
    }, 80);
  }
}
