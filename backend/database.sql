-- =============================================
-- CoSpot Database
-- =============================================

CREATE DATABASE IF NOT EXISTS cospot_db CHARACTER SET utf8 COLLATE utf8_general_ci;
USE cospot_db;

-- =============================================
-- TABLE: utilisateurs
-- =============================================
CREATE TABLE utilisateurs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL,
    prenom      VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    telephone   VARCHAR(30) NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role        ENUM('client','admin') DEFAULT 'client',
    statut      ENUM('actif','gele') DEFAULT 'actif',
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: espaces
-- =============================================
CREATE TABLE espaces (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL,
    type        ENUM('open_space','salle_reunion','bureau_prive') NOT NULL,
    capacite    INT NOT NULL,
    description TEXT,
    statut      ENUM('actif','inactif') DEFAULT 'actif',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: tables_espace (pour open space)
-- =============================================
CREATE TABLE tables_espace (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    espace_id   INT NOT NULL,
    nom         VARCHAR(50) NOT NULL,
    capacite    INT DEFAULT 4,
    pos_x       INT DEFAULT 0,
    pos_y       INT DEFAULT 0,
    FOREIGN KEY (espace_id) REFERENCES espaces(id) ON DELETE CASCADE
);

-- =============================================
-- TABLE: postes (sieges sur chaque table)
-- =============================================
CREATE TABLE postes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    table_id    INT NOT NULL,
    nom         VARCHAR(20) NOT NULL,
    FOREIGN KEY (table_id) REFERENCES tables_espace(id) ON DELETE CASCADE
);

-- =============================================
-- TABLE: reservations
-- =============================================
CREATE TABLE reservations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id  INT NOT NULL,
    espace_id       INT NOT NULL,
    date_reservation DATE NOT NULL,
    date_fin        DATE DEFAULT NULL,
    duree           VARCHAR(30) NOT NULL,
    heure_debut     TIME NOT NULL,
    heure_fin       TIME NOT NULL,
    statut          ENUM('active','annulee','terminee') DEFAULT 'active',
    date_creation   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (espace_id)      REFERENCES espaces(id)      ON DELETE CASCADE
);

-- =============================================
-- TABLE: reservation_postes
-- =============================================
CREATE TABLE reservation_postes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id  INT NOT NULL,
    poste_id        INT NOT NULL,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (poste_id)       REFERENCES postes(id)       ON DELETE CASCADE
);

-- =============================================
-- DONNEES DE TEST
-- =============================================

-- Admin (password: admin123)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Saidi', 'Louay', 'admin@cospot.com',
 '$2y$10$e1b6TU/trBDeIXRZtyB/h.aciibMu62qEAtt7uC9F1jvo0RFTmT..', 'admin');

-- Client (password: client123)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Toumi', 'Ahmed', 'ahmed@cospot.com',
 '$2y$10$wF7wi4S.Zjgwe1Sk/ztZPeZ5TZUJxTx.JBC8WrXrb9AtNBddo7YRe', 'client');

-- Client (password: client123)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Klai', 'Youssef', 'youssef@cospot.com',
 '$2y$10$wF7wi4S.Zjgwe1Sk/ztZPeZ5TZUJxTx.JBC8WrXrb9AtNBddo7YRe', 'client');

-- Espaces
INSERT INTO espaces (nom, type, capacite, description) VALUES
('Zone A - Open Space',  'open_space',    32, 'Espace ouvert avec 8 tables de 4 postes'),
('Salle Confluence',     'salle_reunion', 10, 'Salle equipee ecran + tableau blanc'),
('Salle Horizon',        'salle_reunion',  6, 'Petite salle de reunion'),
('Bureau Prive C-01',    'bureau_prive',   2, 'Bureau ferme et silencieux'),
('Bureau Prive C-02',    'bureau_prive',   4, 'Bureau ferme pour petite equipe');

-- Tables dans Zone A (espace_id = 1)
INSERT INTO tables_espace (espace_id, nom, capacite, pos_x, pos_y) VALUES
(1, 'T-01', 4,  40,  60),
(1, 'T-02', 4, 170,  60),
(1, 'T-03', 4, 300,  60),
(1, 'T-04', 4,  40, 220),
(1, 'T-05', 4, 170, 220),
(1, 'T-06', 4, 300, 220),
(1, 'T-07', 4,  40, 380),
(1, 'T-08', 4, 170, 380);

-- Postes (4 par table, table_id 1 a 8)
INSERT INTO postes (table_id, nom) VALUES
(1,'S1'),(1,'S2'),(1,'S3'),(1,'S4'),
(2,'S1'),(2,'S2'),(2,'S3'),(2,'S4'),
(3,'S1'),(3,'S2'),(3,'S3'),(3,'S4'),
(4,'S1'),(4,'S2'),(4,'S3'),(4,'S4'),
(5,'S1'),(5,'S2'),(5,'S3'),(5,'S4'),
(6,'S1'),(6,'S2'),(6,'S3'),(6,'S4'),
(7,'S1'),(7,'S2'),(7,'S3'),(7,'S4'),
(8,'S1'),(8,'S2'),(8,'S3'),(8,'S4');
