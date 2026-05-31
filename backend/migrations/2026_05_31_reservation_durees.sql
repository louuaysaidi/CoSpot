-- Add date_fin column and update duree column
-- Safe to run multiple times - errors are handled by setup script
ALTER TABLE reservations
  ADD COLUMN date_fin DATE NULL AFTER date_reservation,
  MODIFY duree VARCHAR(30) NOT NULL;
