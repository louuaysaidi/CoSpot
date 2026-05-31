import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reservations.html',
  styleUrls: ['./reservations.css']
})
export class Reservations implements OnInit {

  admin: any = {};
  reservations: any[] = [];
  filteredReservations: any[] = [];
  loading = false;
  searchQuery = '';
  activeFilter = 'all';
  cancellingId: number | null = null;

  selectedReservation: any = null;
  detailLoading = false;

  private api = 'http://localhost/cospot/backend/api';

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.admin = this.auth.getUser();
    this.loadReservations();
  }

  loadReservations() {
    this.loading = true;
    this.cdr.detectChanges();

    this.http.get(`${this.api}/reservation/all.php`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.reservations = res.data || [];
          this.applyFilter();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    let temp = this.reservations;

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      temp = temp.filter(r =>
        (r.prenom && r.prenom.toLowerCase().includes(q)) ||
        (r.nom && r.nom.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.espace_nom && r.espace_nom.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (this.activeFilter !== 'all') {
      temp = temp.filter(r => r.statut === this.activeFilter);
    }

    this.filteredReservations = temp;
    this.cdr.detectChanges();
  }

  filterBy(statut: string) {
    this.activeFilter = statut;
    this.applyFilter();
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
    this.cdr.detectChanges();
  }

  cancelReservation(id: number) {
    this.cancellingId = id;
    this.cdr.detectChanges();

    this.http.post(`${this.api}/reservation/cancel.php`, {
      id: id,
      utilisateur_id: this.reservations.find(r => r.id === id)?.utilisateur_id
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
