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
  errorMsg = '';
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
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.http.get(`${this.api}/reservation/all.php`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.reservations = res.data || [];
          this.applyFilter();
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
  }

  filterBy(statut: string) {
    this.activeFilter = statut;
    this.applyFilter();
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
    this.cdr.detectChanges();
  }

  cancelReservation(id: number) {
    const reservation = this.reservations.find(r => r.id === id);
    if (!reservation) {
      this.errorMsg = 'Reservation introuvable.';
      this.cdr.detectChanges();
      return;
    }

    this.cancellingId = id;
    this.cdr.detectChanges();

    this.http.post(`${this.api}/reservation/cancel.php`, {
      id: id,
      utilisateur_id: reservation.utilisateur_id
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
        this.errorMsg = 'Erreur serveur pendant l annulation.';
        this.cdr.detectChanges();
      }
    });
  }

  trackByReservationId(_: number, reservation: any): number {
    return reservation.id;
  }

  trackByTableId(_: number, table: any): number {
    return table.id;
  }

  trackByPosteId(_: number, poste: any): number {
    return poste.id;
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
