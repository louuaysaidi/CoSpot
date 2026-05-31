import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './utilisateurs.html',
  styleUrl: './utilisateurs.css'
})
export class Utilisateurs implements OnInit {

  utilisateurs: any[] = [];
  loading   = false;
  showForm  = false;
  msg       = '';
  msgType   = '';
  searchTxt = '';

  form: any = {
    nom: '', prenom: '', email: '',
    mot_de_passe: '', role: 'client'
  };

  private api = 'http://localhost/cospot/backend/api/utilisateurs';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.msg = '';
    this.cdr.detectChanges();

    this.http.get(`${this.api}/index.php`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.utilisateurs = res.data || [];
        } else {
          this.msg = res.message || 'Erreur lors du chargement des utilisateurs.';
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

  get filtered() {
    if (!this.searchTxt) return this.utilisateurs;
    const s = this.searchTxt.toLowerCase();
    return this.utilisateurs.filter(u =>
      u.nom.toLowerCase().includes(s) ||
      u.prenom.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s)
    );
  }

  toggleFreeze(u: any) {
    const newStatut = u.statut === 'actif' ? 'gele' : 'actif';
    const label = newStatut === 'gele' ? 'geler' : 'reactiver';
    if (!confirm(`Voulez-vous ${label} ce compte ?`)) return;

    this.http.post(`${this.api}/update.php`, { id: u.id, statut: newStatut }).subscribe({
      next: (res: any) => {
        if (res.success) {
          u.statut = newStatut;
        }
      }
    });
  }

  deleteUser(id: number) {
    if (!confirm('Supprimer definitivement cet utilisateur ?')) return;
    this.http.post(`${this.api}/delete.php`, { id }).subscribe({
      next: (res: any) => {
        if (res.success) this.loadUsers();
      }
    });
  }

  openAdd() {
    this.form = { nom: '', prenom: '', email: '', mot_de_passe: '', role: 'client' };
    this.showForm = true;
    this.msg = '';
  }

  closeForm() { this.showForm = false; this.msg = ''; }

  saveUser() {
    if (!this.form.nom || !this.form.prenom || !this.form.email || !this.form.mot_de_passe) {
      this.msg = 'Veuillez remplir tous les champs.';
      this.msgType = 'error';
      return;
    }
    this.http.post(`${this.api}/create.php`, this.form).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.msg = res.message;
          this.msgType = 'success';
          this.loadUsers();
          setTimeout(() => this.closeForm(), 1200);
        } else {
          this.msg = res.message;
          this.msgType = 'error';
        }
      },
      error: () => { this.msg = 'Erreur serveur.'; this.msgType = 'error'; }
    });
  }
}
