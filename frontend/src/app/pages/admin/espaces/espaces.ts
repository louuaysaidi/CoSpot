import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-espaces',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './espaces.html',
  styleUrl: './espaces.css'
})
export class Espaces implements OnInit {

  espaces: any[] = [];
  loading  = false;
  showForm = false;
  editMode = false;
  msg      = '';
  msgType  = '';

  form: any = {
    id: null, nom: '', type: 'open_space',
    capacite: 1, description: '', statut: 'actif'
  };

  private api = 'http://localhost/cospot/backend/api/espaces';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.loadEspaces(); }

  loadEspaces() {
    this.loading = true;
    this.msg = '';
    this.cdr.detectChanges();

    this.http.get(`${this.api}/index.php`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.espaces = res.data || [];
        } else {
          this.msg = res.message || 'Erreur lors du chargement des espaces.';
          this.msgType = 'error';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        this.msg = 'Erreur HTTP: ' + (err.message || 'Erreur de connexion au serveur.');
        this.msgType = 'error';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  openAdd() {
    this.editMode = false;
    this.form = { id: null, nom: '', type: 'open_space', capacite: 1, description: '', statut: 'actif' };
    this.showForm = true;
    this.msg = '';
  }

  openEdit(e: any) {
    this.editMode = true;
    this.form = { ...e };
    this.showForm = true;
    this.msg = '';
  }

  closeForm() { this.showForm = false; this.msg = ''; }

  trackByEspaceId(_: number, espace: any): number {
    return espace.id;
  }

  saveEspace() {
    if (!this.form.nom || !this.form.type || !this.form.capacite) {
      this.msg = 'Veuillez remplir tous les champs.';
      this.msgType = 'error';
      return;
    }
    const url = this.editMode ? `${this.api}/update.php` : `${this.api}/create.php`;
    this.http.post(url, this.form).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.msg = res.message;
          this.msgType = 'success';
          this.loadEspaces();
          setTimeout(() => this.closeForm(), 1200);
        } else {
          this.msg = res.message;
          this.msgType = 'error';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.msg = 'Erreur serveur.';
        this.msgType = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  deleteEspace(id: number) {
    if (!confirm('Supprimer cet espace ?')) return;
    this.http.post(`${this.api}/delete.php`, { id }).subscribe({
      next: (res: any) => {
        if (res.success) this.loadEspaces();
        this.cdr.detectChanges();
      },
      error: () => {
        this.msg = 'Erreur serveur.';
        this.msgType = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  getTypeLabel(type: string): string {
    return type === 'open_space'    ? 'Open Space'
         : type === 'salle_reunion' ? 'Salle de reunion'
         : 'Bureau prive';
  }

  getTypeClass(type: string): string {
    return type === 'open_space'    ? 'badge-success'
         : type === 'salle_reunion' ? 'badge-blue'
         : 'badge-purple';
  }
}
