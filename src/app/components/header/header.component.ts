import { AfterViewInit, Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, AfterViewInit {
  isMenuOpen = false;
  isMobile = false;
  isScrolled = false;
  activeSection: string = 'home';

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
  private router: Router) {}

goToAdminLogin(event?: Event): void {
  if (event) event.preventDefault(); // Avoid page jump on anchor click
  this.closeMenu(); // Ensure menu closes in mobile view
  this.router.navigate(['/admin-login']);
}


  ngOnInit(): void {
    this.checkScreenSize();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.checkScreenSize(), 0); // Ensure view initialized
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      const scrollY = window.scrollY || window.pageYOffset;
      const heroHeight = document.querySelector('.hero-section')?.clientHeight || 0;
      this.isScrolled = scrollY > heroHeight - 80;

      const sectionIds = ['home', 'about', 'practice', 'contact', 'book'];
      const scrollTop = scrollY + 150;
      this.activeSection = 'home';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const offsetTop = el.offsetTop;
          const offsetBottom = offsetTop + el.offsetHeight;
          if (scrollTop >= offsetTop && scrollTop < offsetBottom) {
            this.activeSection = id;
            break;
          }
        }
      }
    }
  }

  checkScreenSize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 1024; // Changed breakpoint for better tablet support
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
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}