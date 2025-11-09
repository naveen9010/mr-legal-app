import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-premium-loader',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './premium-loader.component.html',
  styleUrl: './premium-loader.component.scss'
})
export class PremiumLoaderComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() overlay: boolean = false;
  @Input() text: string = 'Loading...';
  @Input() showText: boolean = true;
  
  get spinnerDiameter(): number {
    switch (this.size) {
      case 'small': return 40;
      case 'large': return 100;
      default: return 60; // medium
    }
  }
}
