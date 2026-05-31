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
    this.cdr.detectChanges();

    this.http.get(`${this.api}/reservation/all.php`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.reservations = (res.data || []).slice(0, 5);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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