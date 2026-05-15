import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'http://127.0.0.1:5000/api';
  private loggedIn = false;
  private currentUser: any = null;

  constructor(private http: HttpClient, private router: Router) {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      this.loggedIn = true;
    }
  }

  // ===== REGISTER (Sign Up) =====
  register(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, password });
  }

  // ===== LOGIN =====
  loginApi(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password });
  }

  // ===== Set session after login =====
  setSession(user: any) {
    this.loggedIn = true;
    this.currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  }

  // ===== LOGOUT =====
  logout() {
    this.loggedIn = false;
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean { return this.loggedIn; }
  getCurrentUser() { return this.currentUser; }
}