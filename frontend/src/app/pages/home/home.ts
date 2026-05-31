import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {
  stats = [
    { num: '12+', label: 'Espaces disponibles' },
    { num: '340', label: 'Reservations ce mois' },
    { num: '0',   label: 'Conflits de reservation' },
    { num: '98%', label: 'Taux de satisfaction' },
  ];

  steps = [
    { num: '01', title: 'Creez votre compte', desc: 'Inscription en 30 secondes. Votre profil est actif immediatement.' },
    { num: '02', title: 'Choisissez un poste', desc: 'Parcourez le plan interactif et selectionnez 1 a 4 postes libres.' },
    { num: '03', title: 'Confirmation instantanee', desc: 'Votre poste est garanti. Visible dans votre dashboard.' },
  ];

  spaces = [
    { icon: '🖥️', type: 'Open Space', name: 'Bureau partage', desc: 'Tables de 4 postes. Ideal pour freelances.', cap: '1-4 pers. / table', badge: '32 postes', cls: 'a' },
    { icon: '📋', type: 'Salle de reunion', name: 'Salle equipee', desc: 'Ecran, tableau blanc, fibre. Pour votre equipe.', cap: '4-12 personnes', badge: '2 salles', cls: 'b' },
    { icon: '🔒', type: 'Bureau prive', name: 'Espace ferme', desc: 'Bureau silencieux pour missions confidentielles.', cap: '1-4 personnes', badge: '3 bureaux', cls: 'c' },
  ];
}
