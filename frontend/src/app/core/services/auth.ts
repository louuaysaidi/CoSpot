import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'http://localhost/CoSpot/backend/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register.php`, data);
  }

  checkEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-email.php`, { email });
  }

  login(email: string, mot_de_passe: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login.php`, { email, mot_de_passe }).pipe(
      tap((res: any) => {
        if (res.success) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }
}
