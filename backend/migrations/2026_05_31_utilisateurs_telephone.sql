-- Add telephone column if it doesn't exist
-- Safe to run multiple times - errors are handled by setup script
ALTER TABLE utilisateurs
  ADD COLUMN telephone VARCHAR(30) NULL AFTER email;
