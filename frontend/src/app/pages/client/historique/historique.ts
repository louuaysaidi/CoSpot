import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historique.html',
  styleUrls: ['./historique.css']
})
export class Historique implements OnInit {

  user: any = {};
  reservations: any[] = [];
  filteredReservations: any[] = [];
  loading = true;
  errorMsg = '';
  activeFilter = 'all';
  cancellingId: number | null = null;
  counts = {
    all: 0,
    active: 0,
    annulee: 0,
    terminee: 0
  };

  selectedReservation: any = null;
  detailLoading = false;

  private api = 'http://localhost/cospot/backend/api';

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadReservations();
  }

  openDetail(id: number) {
    this.detailLoading = true;
    this.selectedReservation = {};
    this.cdr.detectChanges();

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

  loadReservations() {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.http.get(`${this.api}/reservation/by_user.php?user_id=${this.user.id}`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.reservations = res.data || [];
          this.updateCounts();
          this.applyFilter();
        } else {
          this.errorMsg = res.message || 'Erreur lors du chargement de votre historique.';
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

  filterBy(filter: string) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredReservations = this.reservations;
    } else {
      this.filteredReservations = this.reservations.filter(r => r.statut === this.activeFilter);
    }
  }

  updateCounts() {
    this.counts = {
      all: this.reservations.length,
      active: this.reservations.filter(r => r.statut === 'active').length,
      annulee: this.reservations.filter(r => r.statut === 'annulee').length,
      terminee: this.reservations.filter(r => r.statut === 'terminee').length
    };
  }

  cancelReservation(id: number) {
    this.cancellingId = id;
    this.http.post(`${this.api}/reservation/cancel.php`, {
      id: id,
      utilisateur_id: this.user.id
    }).subscribe({
      next: (res: any) => {
        this.cancellingId = null;
        if (res.success) {
          this.loadReservations();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cancellingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  getCount(statut: string): number {
    return this.counts[statut as keyof typeof this.counts] || 0;
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

  trackByReservationId(_: number, reservation: any): number {
    return reservation.id;
  }
}
