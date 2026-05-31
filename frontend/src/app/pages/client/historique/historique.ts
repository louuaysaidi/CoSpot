import { Component, OnInit } from '@angular/core';
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
  activeFilter = 'all';
  cancellingId: number | null = null;

  selectedReservation: any = null;
  detailLoading = false;

  private api = 'http://localhost/cospot/backend/api';

  constructor(private auth: AuthService, private http: HttpClient) { }

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadReservations();
  }

  openDetail(id: number) {
    this.detailLoading = true;
    this.selectedReservation = {};
    this.http.get(`${this.api}/reservation/detail.php?id=${id}`).subscribe({
      next: (res: any) => {
        this.detailLoading = false;
        if (res.success) this.selectedReservation = res.data;
      },
      error: () => { this.detailLoading = false; }
    });
  }

  closeDetail() {
    this.selectedReservation = null;
  }

  loadReservations() {
    this.loading = true;
    this.http.get(`${this.api}/reservation/by_user.php?user_id=${this.user.id}`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.reservations = res.data;
          this.applyFilter();
        }
      },
      error: () => { this.loading = false; }
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
      },
      error: () => { this.cancellingId = null; }
    });
  }

  getCount(statut: string): number {
    if (statut === 'all') return this.reservations.length;
    return this.reservations.filter(r => r.statut === statut).length;
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
}
