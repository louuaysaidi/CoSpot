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
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  user: any = {};
  reservations: any[] = [];
  recentReservations: any[] = [];
  loading = true;
  errorMsg = '';

  stats = {
    active: 0,
    total: 0,
    annulees: 0
  };

  selectedReservation: any = null;
  detailLoading = false;

  private api = 'http://localhost/cospot/backend/api';

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadReservations();
  }

  loadReservations() {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.http.get(`${this.api}/reservation/by_user.php?user_id=${this.user.id}`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.reservations = res.data || [];
          this.recentReservations = this.reservations.slice(0, 5);
          this.stats.total = this.reservations.length;
          this.stats.active = this.reservations.filter((r: any) => r.statut === 'active').length;
          this.stats.annulees = this.reservations.filter((r: any) => r.statut === 'annulee').length;
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

  openDetail(id: number) {
    this.detailLoading = true;
    this.selectedReservation = {};
    this.http.get(`${this.api}/reservation/detail.php?id=${id}`).subscribe({
      next: (res: any) => {
        this.detailLoading = false;
        if (res.success) this.selectedReservation = res.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.detailLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeDetail() {
    this.selectedReservation = null;
  }

  getStatutClass(statut: string): string {
    return statut === 'active' ? 'badge-success'
      : statut === 'annulee' ? 'badge-danger'
      : 'badge-gray';
  }

  getStatutLabel(statut: string): string {
    return statut === 'active' ? 'Active'
      : statut === 'annulee' ? 'Annulée'
      : 'Terminée';
  }

  getDureeLabel(duree: string): string {
    return duree === 'journee' ? 'Journée' : 'Demi-journée';
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

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  trackByReservationId(_: number, reservation: any): number {
    return reservation.id;
  }
}
