<?php
/**
 * CONFIGURAZIONE BACKEND PER HOSTING ARUBA
 * Supporta sia SQLite (zero configurazione, file unico) che MySQL Aruba.
 */

// Intestazioni CORS e JSON per PWA
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-Token');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configurazione Database
define('DB_TYPE', 'sqlite'); // 'sqlite' oppure 'mysql'
define('SQLITE_FILE', __DIR__ . '/../data/mpa_database.sqlite');

// Parametri MySQL Aruba (da compilare se si usa MySQL al posto di SQLite)
define('MYSQL_HOST', 'localhost');
define('MYSQL_DB', 'SqlXXXXX_X');
define('MYSQL_USER', 'SqlXXXXX');
define('MYSQL_PASS', 'XXXXXXXX');

// PIN Amministratore Predefinito
define('ADMIN_PIN', '1991');

function getDbConnection() {
    try {
        if (DB_TYPE === 'sqlite') {
            $dir = dirname(SQLITE_FILE);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            $pdo = new PDO('sqlite:' . SQLITE_FILE);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        } else {
            $dsn = 'mysql:host=' . MYSQL_HOST . ';dbname=' . MYSQL_DB . ';charset=utf8mb4';
            $pdo = new PDO($dsn, MYSQL_USER, MYSQL_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore connessione database: ' . $e->getMessage()]);
        exit;
    }
}
