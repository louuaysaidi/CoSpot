import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { timeout, debounceTime, Subject } from 'rxjs';

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
  telephone    = '';
  mot_de_passe = '';
  confirmer    = '';
  errorMsg     = '';
  successMsg   = '';
  loading      = false;
  emailChecking = false;
  emailExists  = false;
  submittedEmails = new Set<string>();
  private emailSubject = new Subject<string>();

  constructor(private auth: AuthService, private router: Router) {
    this.emailSubject.pipe(debounceTime(1000)).subscribe(email => {
      this.checkEmailExists(email);
    });
  }

  onEmailChange() {
    const email = this.email.trim().toLowerCase();
    if (email.length > 5) {
      this.emailSubject.next(email);
    } else {
      this.emailExists = false;
      this.emailChecking = false;
    }
  }

  checkEmailExists(email: string) {
    if (!email || email.length < 5) return;
    
    this.emailChecking = true;
    this.auth.checkEmail(email).pipe(timeout(3000)).subscribe({
      next: (res: any) => {
        this.emailChecking = false;
        this.emailExists = res?.exists || false;
      },
      error: () => {
        this.emailChecking = false;
      }
    });
  }

  onSubmit() {
    if (this.loading || this.emailExists || this.emailChecking) return;

    this.errorMsg   = '';
    this.successMsg = '';

    if (!this.nom.trim() || !this.prenom.trim() || !this.email.trim() || !this.telephone.trim() || !this.mot_de_passe) {
      this.errorMsg = 'Veuillez remplir tous les champs, téléphone inclus.';
      return;
    }
    if (this.mot_de_passe !== this.confirmer) {
      this.errorMsg = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.mot_de_passe.length < 6) {
      this.errorMsg = 'Le mot de passe doit avoir au moins 6 caractères.';
      return;
    }

    const emailLower = this.email.trim().toLowerCase();
    if (this.submittedEmails.has(emailLower)) {
      this.errorMsg = 'Cet email a déjà été soumis. Veuillez attendre la réponse du serveur.';
      return;
    }

    this.loading = true;
    this.submittedEmails.add(emailLower);

    this.auth.register({
      nom: this.nom.trim(),
      prenom: this.prenom.trim(),
      email: emailLower,
      telephone: this.telephone.trim(),
      mot_de_passe: this.mot_de_passe
    }).pipe(timeout(5000)).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.submittedEmails.delete(emailLower);
        if (res.success) {
          this.successMsg = 'Compte créé ! Redirection...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        } else {
          this.errorMsg = res.message || 'Erreur lors de la création du compte.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.submittedEmails.delete(emailLower);
        const message = err?.error?.message || err?.message || 'Erreur de connexion au serveur.';
        this.errorMsg = err?.name === 'TimeoutError'
          ? 'Le serveur met trop de temps à répondre (5s). Réessayez.'
          : message;
      }
    });
  }
}
