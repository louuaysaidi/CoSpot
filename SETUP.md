# CoSpot - Server Setup Instructions

## Issues Fixed
1. ✅ Database path case-sensitivity corrected in frontend API service
2. ✅ Created database initialization script

## Quick Setup Steps

### Step 1: Ensure MySQL is Running
- If using XAMPP, start the **MySQL** service from XAMPP Control Panel
- Verify it shows "Running" in green

### Step 2: Initialize the Database
Choose ONE option:

#### Option A: Using the Setup Script (Recommended)
1. Open browser and go to: `http://localhost/CoSpot/setup-database.php`
2. You should see:
   ```
   ✓ Connected to MySQL
   ✓ Database setup completed successfully!
   ✅ Database 'cospot_db' created with all tables.
   ```

#### Option B: Manual SQL Execution
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click "SQL" tab at the top
3. Open file: `CoSpot/backend/database.sql`
4. Copy all content and paste into phpMyAdmin SQL editor
5. Click "Go" to execute

#### Option C: Command Line (MySQL CLI)
```bash
mysql -u root < "C:\xampp\htdocs\CoSpot\backend\database.sql"
```

### Step 3: Start Angular Development Server
```bash
cd C:\xampp\htdocs\CoSpot\frontend
npm install  # if not already done
ng serve
```

### Step 4: Access the Application
- Open browser: `http://localhost:4200`
- You should now see the login page without errors

## Verification
- ✅ Login page loads without "Erreur du serveur" error
- ✅ Email validation works when typing
- ✅ Can create new account or login

## Database Details
- **Database Name**: cospot_db
- **Host**: 127.0.0.1
- **Username**: root
- **Password**: (empty)
- **Tables Created**: utilisateurs, espaces, tables_espace, postes, reservations, etc.

## API Endpoints
- Register: `POST http://localhost/CoSpot/backend/api/auth/register.php`
- Login: `POST http://localhost/CoSpot/backend/api/auth/login.php`
- Check Email: `POST http://localhost/CoSpot/backend/api/auth/check-email.php`

## If Still Getting Errors
1. Check MySQL is running in XAMPP Control Panel
2. Run setup-database.php again
3. Check browser console for CORS errors
4. Check .htaccess configuration in `/backend/`
