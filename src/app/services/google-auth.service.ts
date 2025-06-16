import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleLoginService {
  private token: string | null = null;

  /**
   * Requests access token using OAuth 2 flow (not ID token).
   */
  requestAccessToken(clientId: string, scope: string, callback: (accessToken: string | null) => void): void {
    if (typeof google === 'undefined') {
      console.error('❌ Google API not loaded.');
      callback(null);
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scope,
      callback: (response: any) => {
        if (response && response.access_token) {
          this.token = response.access_token;
          callback(this.token);
        } else {
          console.error('❌ Access token not returned');
          callback(null);
        }
      }
    });

    tokenClient.requestAccessToken();
  }

  getToken(): string | null {
    return this.token;
  }
}
