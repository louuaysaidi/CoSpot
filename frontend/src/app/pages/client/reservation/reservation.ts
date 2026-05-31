import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reservation.html',
  styleUrls: ['./reservation.css']
})
export class Reservation implements OnInit {

  // Step 1: choose espace
  espaces: any[] = [];
  selectedEspace: any = null;

  // Step 2: date & duration
  dateReservation = '';
  duree: 'journee' | 'demi_journee' = 'journee';
  minDate = '';

  // Step 3: pick postes
  tables: any[] = [];
  selectedPostes: number[] = [];
  maxPostes = 4;

  // UI state
  step = 1;
  loading = false;
  loadingPostes = false;
  errorMsg = '';
  successMsg = '';

  private api = 'http://localhost/cospot/backend/api';
  private user: any;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();

    // Set min date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.dateReservation = this.minDate;

    this.loadEspaces();
  }

  loadEspaces() {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.http.get(`${this.api}/espaces/index.php`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.espaces = (res.data || []).filter((e: any) => e && e.statut === 'actif');
          if (this.espaces.length === 0) {
            this.errorMsg = 'Aucun espace actif trouve dans la base de donnees.';
          }
        } else {
          this.errorMsg = res.message || 'Erreur lors du chargement des espaces.';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = 'Erreur HTTP/Serveur : ' + (err.statusText || 'Impossible de se connecter à l\'API backend.');
        console.error('loadEspaces error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  selectEspace(espace: any) {
    this.selectedEspace = espace;
    this.selectedPostes = [];
    this.step = 2;
  }

  goToStep3() {
    if (!this.dateReservation) {
      this.errorMsg = 'Veuillez choisir une date.';
      return;
    }
    this.errorMsg = '';
    this.step = 3;
    this.loadPostes();
  }

  loadPostes() {
    this.loadingPostes = true;
    this.cdr.detectChanges();
    this.http.get(`${this.api}/reservation/postes_dispo.php?espace_id=${this.selectedEspace.id}&date=${this.dateReservation}`)
      .subscribe({
        next: (res: any) => {
          this.loadingPostes = false;
          if (res.success) {
            this.tables = res.data;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingPostes = false;
          this.cdr.detectChanges();
        }
      });
  }

  togglePoste(posteId: number, disponible: boolean) {
    if (!disponible) return;
    const idx = this.selectedPostes.indexOf(posteId);
    if (idx > -1) {
      this.selectedPostes.splice(idx, 1);
    } else {
      if (this.selectedPostes.length >= this.maxPostes) {
        this.errorMsg = `Maximum ${this.maxPostes} postes par reservation.`;
        return;
      }
      this.errorMsg = '';
      this.selectedPostes.push(posteId);
    }
  }

  isSelected(posteId: number): boolean {
    return this.selectedPostes.includes(posteId);
  }

  getHeures(): { debut: string, fin: string } {
    if (this.duree === 'journee') {
      return { debut: '08:00', fin: '18:00' };
    }
    return { debut: '08:00', fin: '13:00' };
  }

  confirmer() {
    if (this.selectedEspace.type === 'open_space' && this.selectedPostes.length === 0) {
      this.errorMsg = 'Veuillez selectionner au moins un poste.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
    const heures = this.getHeures();

    const body: any = {
      utilisateur_id: this.user.id,
      espace_id: this.selectedEspace.id,
      date_reservation: this.dateReservation,
      duree: this.duree,
      heure_debut: heures.debut,
      heure_fin: heures.fin
    };

    if (this.selectedPostes.length > 0) {
      body.postes = this.selectedPostes;
    }

    this.http.post(`${this.api}/reservation/create.php`, body).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.successMsg = 'Reservation confirmee ! Redirection...';
          setTimeout(() => this.router.navigate(['/client/historique']), 1500);
        } else {
          this.errorMsg = res.message;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Erreur de connexion au serveur.';
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    if (this.step > 1) {
      this.step--;
      this.errorMsg = '';
      this.successMsg = '';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'open_space': return '🖥️';
      case 'salle_reunion': return '📋';
      case 'bureau_prive': return '🔒';
      default: return '🏢';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'open_space': return 'Open Space';
      case 'salle_reunion': return 'Salle de réunion';
      case 'bureau_prive': return 'Bureau privé';
      default: return type;
    }
  }
}
