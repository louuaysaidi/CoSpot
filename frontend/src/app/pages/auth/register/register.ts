import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  nom          = '';
  prenom       = '';
  email        = '';
  mot_de_passe = '';
  confirmer    = '';
  errorMsg     = '';
  successMsg   = '';
  loading      = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.errorMsg   = '';
    this.successMsg = '';

    if (!this.nom || !this.prenom || !this.email || !this.mot_de_passe) {
      this.errorMsg = 'Veuillez remplir tous les champs.';
      return;
    }
    if (this.mot_de_passe !== this.confirmer) {
      this.errorMsg = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.mot_de_passe.length < 6) {
      this.errorMsg = 'Le mot de passe doit avoir au moins 6 caracteres.';
      return;
    }

    this.loading = true;
    this.auth.register({
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      mot_de_passe: this.mot_de_passe
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.successMsg = 'Compte cree ! Redirection...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
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
