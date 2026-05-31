import { Component } from '@angular/core';
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

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.mot_de_passe) {
      this.errorMsg = 'Veuillez remplir tous les champs.';
      return;
    }
    this.loading  = true;
    this.errorMsg = '';

    this.auth.login(this.email, this.mot_de_passe).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          if (res.user.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/client/dashboard']);
          }
        } else {
          this.errorMsg = res.message;
        }
      },
      error: () => {
        this.loading  = false;
        this.errorMsg = 'Erreur de connexion au serveur.';
      }
    });
  }
}
