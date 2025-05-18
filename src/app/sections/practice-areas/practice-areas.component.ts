import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-practice-areas',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatRippleModule],
  templateUrl: './practice-areas.component.html',
  styleUrls: ['./practice-areas.component.scss']
})
export class PracticeAreasComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  practiceCategories = [
    {
      title: 'Personal & Family Law',
      icon: 'groups',
      areas: [
        'Family Law',
        'Domestic Violence',
        'Sexual Assault/Abuse',
        'Defamation Defense'
      ]
    },
    {
      title: 'Corporate & Business Law',
      icon: 'lock',
      areas: [
        'Corporate Law',
        'Commercial Law',
        'Administrative Law',
        'Tax Law'
      ]
    },
    {
      title: 'Civil & Criminal Law',
      icon: 'gavel',
      areas: [
        'Civil Law',
        'Criminal Law',
        'Constitutional Law',
        'Cyber Law'
      ]
    },
    {
      title: 'Property & Immigration Law',
      icon: 'location_city',
      areas: [
        'Real Estate Law',
        'RERA',
        'Immigration Law',
        'Labour and Employment Law'
      ]
    },
    {
      title: 'Banking, Health & Education',
      icon: 'account_balance',
      areas: [
        'Banking and Financial Law',
        'Insurance Law',
        'Health Law',
        'Education Law'
      ]
    },
    {
      title: 'Specialized Disputes',
      icon: 'scale',
      areas: [
        'Arbitration and Mediation',
        'Stalking/Harassment',
        'Blackmail/Extortion/Sextortion',
        'Patents, Trademarks and Copyrights'
      ]
    }
  ];

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const AOS = await import('aos');
      AOS.init({
        duration: 800,
        once: true
      });
    }
  }
}
