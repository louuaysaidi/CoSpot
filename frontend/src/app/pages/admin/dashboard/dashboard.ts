import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  admin: any = {};

  stats = [
    { label: 'Espaces actifs',          value: '—', icon: '🏢', color: 'green' },
    { label: 'Réservations aujourd\'hui', value: '—', icon: '📅', color: 'blue' },
    { label: 'Utilisateurs inscrits',   value: '—', icon: '👥', color: 'purple' },
    { label: 'Taux d\'occupation',       value: '—', icon: '📊', color: 'orange' },
  ];

  reservations: any[] = [];
  loading       = false;
  statsLoading  = true;
  errorMsg      = '';

  private api = 'http://localhost/cospot/backend/api';

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.admin = this.auth.getUser();
    this.loadStats();
    this.loadReservations();
  }

  loadStats() {
    this.statsLoading = true;
    this.cdr.detectChanges();

    this.http.get(`${this.api}/reservation/stats.php`).subscribe({
      next: (res: any) => {
        this.statsLoading = false;
        if (res.success) {
          this.stats[0].value = String(res.espaces_actifs);
          this.stats[1].value = String(res.reservations_today);
          this.stats[2].value = String(res.utilisateurs);
          this.stats[3].value = res.taux_occupation + '%';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.statsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadReservations() {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.http.get(`${this.api}/reservation/all.php`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.reservations = (res.data || []).slice(0, 5);
        } else {
          this.errorMsg = res.message || 'Erreur lors du chargement des reservations.';
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

  trackByStatLabel(_: number, stat: any): string {
    return stat.label;
  }

  trackByReservationId(_: number, reservation: any): number {
    return reservation.id;
  }

  getDureeLabel(duree: string): string {
    switch (duree) {
      case 'journee': return 'Journee';
      case 'demi_journee': return 'Demi-journee';
      case 'salle_1h': return '1 heure';
      case 'salle_2h': return '2 heures';
      case 'bureau_1_semaine': return '1 semaine';
      case 'bureau_2_semaines': return '2 semaines';
      case 'bureau_1_mois': return '1 mois';
      default: return duree;
    }
  }

  getStatutClass(statut: string): string {
    return statut === 'active'  ? 'badge-success'
      : statut === 'annulee' ? 'badge-danger'
      : 'badge-gray';
  }

  getStatutLabel(statut: string): string {
    return statut === 'active'  ? 'Active'
      : statut === 'annulee' ? 'Annulée'
      : 'Terminée';
  }
}
