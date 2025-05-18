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
    { image: 'assets/hero1.jpg', quote: 'Empowering Justice, One Case at a Time.' },
    { image: 'assets/hero2.jpg', quote: 'Protecting Your Rights with Integrity.' },
    { image: 'assets/hero3.png', quote: 'Legal Solutions Tailored for You.' },
    { image: 'assets/hero4.png', quote: 'Advocating with Passion and Purpose.' },
    { image: 'assets/hero5.jpg', quote: 'Expertise. Experience. Excellence.' },
    { image: 'assets/hero6.png', quote: 'Where Law Meets Loyalty.' }
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

  scrollToWhyChoose(): void {
    const section = document.getElementById('why-choose');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
