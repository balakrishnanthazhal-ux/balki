import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  activeTab: 'login' | 'signup' = 'login';

  username = '';
  password = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;
  error = '';
  loading = false;

  signupSubmitted = false;
  signupSuccess = false;

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/form']);
    }
  }

  // ===== LOGIN =====
  onLogin() {
    if (!this.username || !this.password) {
      this.error = 'Please enter username and password';
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.loginApi(this.username, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.auth.setSession(res.user);
        this.router.navigate(['/form']);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.error || 'Invalid username or password';
        this.shake();
      }
    });
  }

  // ===== SIGN UP =====
  onSignUp() {
    this.signupSubmitted = true;
    this.error = '';
    this.signupSuccess = false;

    if (!this.username) { return; }
    if (!this.password) { return; }
    if (!this.confirmPassword) { return; }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;

    this.auth.register(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.signupSuccess = true;
        this.signupSubmitted = false;
        setTimeout(() => {
          this.activeTab = 'login';
          this.signupSuccess = false;
          this.clearFields();
        }, 1500);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.error || 'Registration failed. Try again.';
      }
    });
  }

  // ===== PASSWORD STRENGTH =====
  get passwordStrength(): { percent: number; color: string; label: string } {
    const p = this.password;
    if (!p) return { percent: 0, color: '#ff4444', label: '' };

    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    const levels = [
      { percent: 20,  color: '#ff4444', label: 'Very Weak' },
      { percent: 40,  color: '#ff7700', label: 'Weak' },
      { percent: 60,  color: '#ffb300', label: 'Fair' },
      { percent: 80,  color: '#00b0ff', label: 'Strong' },
      { percent: 100, color: '#00e676', label: 'Very Strong' },
    ];
    return levels[Math.min(score, 4)];
  }

  clearFields() {
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.signupSubmitted = false;
    this.signupSuccess = false;
  }

  shake() {
    const card = document.querySelector('.login-card') as HTMLElement;
    card?.classList.add('shake');
    setTimeout(() => card?.classList.remove('shake'), 500);
  }
}