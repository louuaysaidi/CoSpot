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
    { label: 'Espaces actifs', value: '5', icon: '🏢', color: 'green' },
    { label: 'Reservations aujourdhui', value: '0', icon: '📅', color: 'blue' },
    { label: 'Utilisateurs inscrits', value: '2', icon: '👥', color: 'purple' },
    { label: 'Taux occupation', value: '0%', icon: '📊', color: 'orange' },
  ];

  reservations: any[] = [];
  loading = false;

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
    return statut === 'active' ? 'badge-success'
      : statut === 'annulee' ? 'badge-danger'
        : 'badge-gray';
  }
}