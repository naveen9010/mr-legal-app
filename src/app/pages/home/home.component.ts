import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { WhyChooseUsComponent } from '../../sections/why-choose-us/why-choose-us.component';
import { PracticeAreasComponent } from '../../sections/practice-areas/practice-areas.component';
import { ClientTestimonialsComponent } from '../../sections/client-testimonials/client-testimonials.component';
import { BookConsultationComponent } from '../../sections/book-consultation/book-consultation.component';
import { AboutUsComponent } from '../../sections/about-us/about-us.component';
import { ContactUsComponent } from '../../sections/contact-us/contact-us.component';
import { FooterComponent } from '../../sections/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, HeroComponent, WhyChooseUsComponent, PracticeAreasComponent, ClientTestimonialsComponent, BookConsultationComponent, AboutUsComponent, ContactUsComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {}
