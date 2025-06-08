import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient } from '@angular/common/http'; // ✅ ADD THIS

import { routes } from './app.routes';
import { FIREBASE_PROVIDERS } from './config/firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(), // ✅ FIXED: Provide HttpClient for NotificationService
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),

    ...FIREBASE_PROVIDERS,

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:3000'
    })
  ]
};
