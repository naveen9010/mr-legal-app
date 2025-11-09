import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleLoginService {
  private token: string | null = null;
  private clientId = '611773104435-bge1nsjpqd8g0g1u5nd8bmvm1m1ehdk3.apps.googleusercontent.com';
  private scope = 'https://www.googleapis.com/auth/calendar.events';
  private tokenExpiryTime: number | null = null;
  private tokenClient: any = null;

  /**
   * Initializes the Google API client
   */
  initClient(): void {
    if (typeof google === 'undefined') {
      console.error('❌ Google API not loaded.');
      return;
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: this.scope,
      callback: (response: any) => {
        if (response && response.access_token) {
          this.token = response.access_token;
          // Set token expiry (typically 1 hour for Google OAuth)
          this.tokenExpiryTime = Date.now() + (response.expires_in || 3600) * 1000;
          console.log('✅ Access Token received and stored');
        } else {
          console.error('❌ Access token not returned');
          this.token = null;
          this.tokenExpiryTime = null;
        }
      }
    });
  }

  /**
   * Authenticates with Google and gets an access token
   * @returns Promise that resolves when authentication is complete
   */
  authenticate(): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof google === 'undefined') {
        console.error('❌ Google API not loaded.');
        resolve(null);
        return;
      }

      if (!this.tokenClient) {
        this.initClient();
      }

      this.tokenClient.callback = (response: any) => {
        if (response && response.access_token) {
          this.token = response.access_token;
          this.tokenExpiryTime = Date.now() + (response.expires_in || 3600) * 1000;
          resolve(this.token);
        } else {
          console.error('❌ Access token not returned');
          this.token = null;
          this.tokenExpiryTime = null;
          resolve(null);
        }
      };

      this.tokenClient.requestAccessToken();
    });
  }

  /**
   * Checks if we have a valid token and returns it, or gets a new one if needed
   * @returns Promise that resolves with the token
   */
  async getOrRequestToken(): Promise<string | null> {
    // If we have a valid token, return it
    if (this.token && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime) {
      return this.token;
    }
    
    // Otherwise, request a new token
    return this.authenticate();
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getOrRequestToken instead
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
          this.tokenExpiryTime = Date.now() + (response.expires_in || 3600) * 1000;
          callback(this.token);
        } else {
          console.error('❌ Access token not returned');
          callback(null);
        }
      }
    });

    tokenClient.requestAccessToken();
  }

  /**
   * Gets the current token if available
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Checks if the user is authenticated with Google
   */
  isAuthenticated(): boolean {
    return !!this.token && !!this.tokenExpiryTime && Date.now() < this.tokenExpiryTime;
  }
}
