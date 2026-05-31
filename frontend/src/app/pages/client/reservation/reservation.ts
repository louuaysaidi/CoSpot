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
  creneau: 'journee' | 'matin' | 'apres_midi' = 'journee';
  salleDuree: 'salle_1h' | 'salle_2h' | 'salle_3h' | 'salle_4h' = 'salle_1h';
  salleHeureDebut = '08:00';
  bureauDuree: 'bureau_1_semaine' | 'bureau_2_semaines' | 'bureau_1_mois' = 'bureau_1_semaine';
  minDate = '';
  salleHeures = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // Step 3: pick postes
  tables: any[] = [];
  selectedPostes: number[] = [];
  selectedTableId: number | null = null;
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
    this.selectedTableId = null;
    this.creneau = 'journee';
    this.salleDuree = 'salle_1h';
    this.salleHeureDebut = '08:00';
    this.bureauDuree = 'bureau_1_semaine';
    this.step = 2;
  }

  goToStep3() {
    if (!this.dateReservation) {
      this.errorMsg = 'Veuillez choisir une date.';
      return;
    }
    this.errorMsg = '';
    this.step = 3;
    this.selectedPostes = [];
    this.selectedTableId = null;

    if (this.selectedEspace.type === 'open_space') {
      this.loadPostes();
    } else {
      this.tables = [];
      this.loadingPostes = false;
      this.cdr.detectChanges();
    }
  }

  loadPostes() {
    this.loadingPostes = true;
    this.cdr.detectChanges();
    const heures = this.getHeures();
    const params = new URLSearchParams({
      espace_id: String(this.selectedEspace.id),
      date: this.dateReservation,
      heure_debut: heures.debut,
      heure_fin: heures.fin
    });

    this.http.get(`${this.api}/reservation/postes_dispo.php?${params.toString()}`)
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

  togglePoste(posteId: number, tableId: number, disponible: boolean) {
    if (!disponible) return;

    if (this.selectedTableId !== null && this.selectedTableId !== tableId && !this.isSelected(posteId)) {
      this.errorMsg = 'Vous pouvez selectionner des postes dans une seule table par reservation.';
      return;
    }

    const idx = this.selectedPostes.indexOf(posteId);
    if (idx > -1) {
      this.selectedPostes.splice(idx, 1);
      if (this.selectedPostes.length === 0) {
        this.selectedTableId = null;
      }
    } else {
      if (this.selectedPostes.length >= this.maxPostes) {
        this.errorMsg = `Maximum ${this.maxPostes} postes par reservation.`;
        return;
      }
      this.errorMsg = '';
      this.selectedTableId = tableId;
      this.selectedPostes.push(posteId);
    }
  }

  isSelected(posteId: number): boolean {
    return this.selectedPostes.includes(posteId);
  }

  isLockedTable(tableId: number): boolean {
    return this.selectedTableId !== null && this.selectedTableId !== tableId;
  }

  isPosteSelectable(posteId: number, tableId: number, disponible: boolean): boolean {
    return disponible && (!this.isLockedTable(tableId) || this.isSelected(posteId));
  }

  getHeures(): { debut: string, fin: string } {
    if (this.selectedEspace?.type === 'salle_reunion') {
      return {
        debut: this.salleHeureDebut,
        fin: this.addHours(this.salleHeureDebut, this.getSalleDureeHours())
      };
    }

    if (this.selectedEspace?.type === 'bureau_prive') {
      return { debut: '00:00', fin: '23:59' };
    }

    if (this.creneau === 'journee') {
      return { debut: '08:00', fin: '18:00' };
    }
    if (this.creneau === 'apres_midi') {
      return { debut: '13:00', fin: '18:00' };
    }
    return { debut: '08:00', fin: '13:00' };
  }

  getDuree(): string {
    if (this.selectedEspace?.type === 'salle_reunion') return this.salleDuree;
    if (this.selectedEspace?.type === 'bureau_prive') return this.bureauDuree;
    return this.creneau === 'journee' ? 'journee' : 'demi_journee';
  }

  getCreneauLabel(): string {
    if (this.selectedEspace?.type === 'salle_reunion') {
      const hours = this.getSalleDureeHours();
      return `${hours} heure${hours > 1 ? 's' : ''} (${this.salleHeureDebut} - ${this.addHours(this.salleHeureDebut, hours)})`;
    }

    if (this.selectedEspace?.type === 'bureau_prive') {
      if (this.bureauDuree === 'bureau_1_mois') return `1 mois, jusqu'au ${this.getDateFin()}`;
      if (this.bureauDuree === 'bureau_2_semaines') return `2 semaines, jusqu'au ${this.getDateFin()}`;
      return `1 semaine, jusqu'au ${this.getDateFin()}`;
    }

    if (this.creneau === 'journee') return 'Journee complete';
    if (this.creneau === 'apres_midi') return 'Demi-journee apres-midi';
    return 'Demi-journee matin';
  }

  getSalleHeuresDisponibles(): string[] {
    const maxStartHour = 18 - this.getSalleDureeHours();
    return this.salleHeures.filter(h => Number(h.slice(0, 2)) <= maxStartHour);
  }

  syncSalleHeure() {
    if (!this.getSalleHeuresDisponibles().includes(this.salleHeureDebut)) {
      this.salleHeureDebut = this.getSalleHeuresDisponibles().at(-1) || '08:00';
    }
  }

  getSalleDureeHours(): number {
    switch (this.salleDuree) {
      case 'salle_4h': return 4;
      case 'salle_3h': return 3;
      case 'salle_2h': return 2;
      default: return 1;
    }
  }

  getDateFin(): string {
    const date = new Date(`${this.dateReservation}T00:00:00`);
    if (this.bureauDuree === 'bureau_1_semaine') date.setDate(date.getDate() + 6);
    if (this.bureauDuree === 'bureau_2_semaines') date.setDate(date.getDate() + 13);
    if (this.bureauDuree === 'bureau_1_mois') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(date.getDate() - 1);
    }
    return date.toISOString().split('T')[0];
  }

  private addHours(time: string, hours: number): string {
    const [h, m] = time.split(':').map(Number);
    return `${String(h + hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
      date_fin: this.selectedEspace.type === 'bureau_prive' ? this.getDateFin() : this.dateReservation,
      duree: this.getDuree(),
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
