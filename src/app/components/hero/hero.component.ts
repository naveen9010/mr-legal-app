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
    {
      desktopImage: 'assets/hero1.jpg',
      mobileImage: 'assets/mobile-hero1.png',
      quote: 'Empowering Justice, One Case at a Time.'
    },
    {
      desktopImage: 'assets/hero2.jpg',
      mobileImage: 'assets/mobile-hero2.png',
      quote: 'Protecting Your Rights with Integrity.'
    },
    {
      desktopImage: 'assets/hero3.png',
      mobileImage: 'assets/mobile-hero3.png',
      quote: 'Legal Solutions Tailored for You.'
    },
    {
      desktopImage: 'assets/hero4.png',
      mobileImage: 'assets/mobile-hero4.png',
      quote: 'Advocating with Passion and Purpose.'
    },
    {
      desktopImage: 'assets/hero5.jpg',
      mobileImage: 'assets/mobile-hero5.png',
      quote: 'Expertise. Experience. Excellence.'
    },
    {
      desktopImage: 'assets/hero6.png',
      mobileImage: 'assets/mobile-hero6.png',
      quote: 'Where Law Meets Loyalty.'
    }
  ];

  currentSlideIndex = 0;
  currentQuote = '';
  isBrowser: boolean;
  isMobileView = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.checkDeviceType();
      this.startSlideShow();
    }
  }

  checkDeviceType(): void {
    this.isMobileView = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobileView = window.innerWidth <= 768;
    });
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
