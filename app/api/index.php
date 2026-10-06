<?php
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();

// Inizializzazione tabelle (se SQLite è appena creato)
$pdo->exec("
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        code TEXT,
        title TEXT,
        client TEXT,
        category TEXT,
        status TEXT,
        is_confidential INTEGER DEFAULT 0,
        deadline TEXT,
        cover_notes TEXT,
        cad_software TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS components (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        code TEXT,
        title TEXT,
        page_number INTEGER,
        image TEXT,
        cut_status TEXT,
        assembly_status TEXT,
        cut_operator TEXT,
        assembly_operator TEXT,
        cut_start_time TEXT,
        cut_end_time TEXT,
        assembly_start_time TEXT,
        assembly_end_time TEXT,
        note TEXT
    );

    CREATE TABLE IF NOT EXISTS morali (
        id TEXT PRIMARY KEY,
        component_id TEXT,
        qty INTEGER,
        length TEXT,
        description TEXT,
        checked INTEGER DEFAULT 0
    );
");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ROUTING API
switch ($action) {
    case 'verify_pin':
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $pin = $input['pin'] ?? '';
            if ($pin === ADMIN_PIN) {
                echo json_encode(['success' => true, 'role' => 'admin']);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'PIN errato']);
            }
        }
        break;

    case 'projects':
        if ($method === 'GET') {
            $showConfidential = isset($_GET['admin']) && $_GET['admin'] === '1';
            $sql = $showConfidential ? "SELECT * FROM projects ORDER BY deadline ASC" : "SELECT * FROM projects WHERE is_confidential = 0 ORDER BY deadline ASC";
            $stmt = $pdo->query($sql);
            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['projects' => $projects]);
        }
        break;

    case 'health':
    default:
        echo json_encode([
            'status' => 'ok',
            'company' => 'M.P.A. di Maurizio Cavallaro',
            'system' => 'Gestionale Produzione 4.0',
            'version' => '1.0.0'
        ]);
        break;
}
