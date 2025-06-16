import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent {
  email = '';
  password = '';
  loginError = '';

  constructor(private auth: Auth, private router: Router, private snackBar: MatSnackBar) {}

  async login() {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);

      // ✅ Store admin email in localStorage
      localStorage.setItem('adminEmail', userCredential.user.email || this.email);

      this.snackBar.open('Login Successful!', 'Close', { duration: 3000 });
      this.router.navigate(['/admin-dashboard']);
    } catch (error: any) {
      this.loginError = error.message || 'Login failed!';
    }
  }

  goHome(): void {
  this.router.navigate(['/']);
  }

}
