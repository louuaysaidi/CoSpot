ALTER TABLE reservations
  ADD COLUMN date_fin DATE NULL AFTER date_reservation,
  MODIFY duree VARCHAR(30) NOT NULL;
