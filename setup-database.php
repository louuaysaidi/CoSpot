<?php
/**
 * CoSpot Database Setup Script
 * Run this file once to initialize the database and tables
 */

// Database connection parameters
$host = "127.0.0.1";
$username = "root";
$password = "";

try {
    // Connect to MySQL without a database
    $pdo = new PDO(
        "mysql:host=$host;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    echo "✓ Connected to MySQL\n";

    // Read the database.sql file
    $sqlFile = __DIR__ . '/backend/database.sql';
    if (!file_exists($sqlFile)) {
        die("❌ database.sql file not found at: $sqlFile\n");
    }

    $sql = file_get_contents($sqlFile);

    // Execute the SQL statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    $executedCount = 0;
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $pdo->exec($statement);
                $executedCount++;
                echo "✓ " . substr($statement, 0, 60) . "...\n";
            } catch (PDOException $e) {
                // Skip if table/data already exists
                if (strpos($e->getMessage(), 'already exists') !== false || 
                    strpos($e->getMessage(), 'Duplicate') !== false) {
                    echo "⚠ " . substr($statement, 0, 60) . "... (skipped)\n";
                } else {
                    throw $e;
                }
            }
        }
    }

    // Run migrations
    echo "\nRunning migrations...\n";
    $migrationsDir = __DIR__ . '/backend/migrations';
    if (is_dir($migrationsDir)) {
        $migrations = glob($migrationsDir . '/*.sql');
        sort($migrations);
        
        foreach ($migrations as $migFile) {
            $migSql = file_get_contents($migFile);
            $migStatements = array_filter(array_map('trim', explode(';', $migSql)));
            
            foreach ($migStatements as $statement) {
                if (!empty($statement)) {
                    try {
                        $pdo->exec($statement);
                        echo "✓ " . basename($migFile) . "\n";
                    } catch (PDOException $e) {
                        if (strpos($e->getMessage(), 'Duplicate') !== false) {
                            echo "⚠ " . basename($migFile) . " (already applied)\n";
                        } else {
                            throw $e;
                        }
                    }
                }
            }
        }
    }

    echo "\n✅ Database setup completed successfully!\n";
    echo "✅ Database 'cospot_db' created with all tables.\n";
    echo "\nTest credentials:\n";
    echo "  Admin: admin@cospot.com / admin123\n";
    echo "  Client: ahmed@cospot.com / client123\n";
    echo "\nYou can now login with the application.\n";
    echo "API URL: http://localhost/CoSpot/backend/api/auth/\n";

} catch (PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
} catch (Exception $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
?>
