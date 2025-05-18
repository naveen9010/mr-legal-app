import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isMenuOpen = false;
  isMobile = false;
  isScrolled = false;
  activeSection: string = 'home';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.onWindowScroll(); // initialize on page load
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      const heroHeight = document.querySelector('.hero-section')?.clientHeight || 0;
      const scrollY = window.scrollY || window.pageYOffset;
      this.isScrolled = scrollY > heroHeight - 80;

      // Scroll Spy Logic
      const sectionIds = ['home', 'about', 'practice', 'contact', 'book'];
      const scrollTop = scrollY + 150; // header offset

      // Default to home unless matched below
      this.activeSection = 'home';

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section) {
          const offsetTop = section.offsetTop;
          const offsetBottom = offsetTop + section.offsetHeight;

          if (scrollTop >= offsetTop && scrollTop < offsetBottom) {
            this.activeSection = id;
            break;
          }
        }
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 768;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  scrollToSection(id: string): void {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        console.warn(`Element with id #${id} not found`);
      }
    }, 100);
  }
}
