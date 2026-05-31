import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email       = '';
  mot_de_passe = '';
  errorMsg    = '';
  loading     = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    if (this.loading) return;

    const email = this.email.trim();
    const motDePasse = this.mot_de_passe;

    if (!email || !motDePasse) {
      this.errorMsg = 'Veuillez remplir tous les champs.';
      this.cdr.detectChanges();
      return;
    }

    this.loading  = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.auth.login(email, motDePasse).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          if (res.user.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/client/dashboard']);
          }
        } else {
          this.errorMsg = res.message || 'Email ou mot de passe incorrect.';
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.loading  = false;
        this.errorMsg = this.getLoginErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  private getLoginErrorMessage(err: any): string {
    if (err?.error?.message) return err.error.message;

    if (typeof err?.error === 'string') {
      try {
        const parsed = JSON.parse(err.error);
        if (parsed?.message) return parsed.message;
      } catch {
        return err.error;
      }
    }

    if (err?.status === 401) return 'Email ou mot de passe incorrect.';
    if (err?.status === 403) return 'Votre compte est bloque. Contactez l administrateur.';

    return 'Erreur de connexion au serveur.';
  }
}
