<?php

declare(strict_types=1);

/**
 * Database connection (PDO + MySQL).
 * Reads credentials from config.php, which is NOT committed to git —
 * see config.sample.php for the template and README.md for setup.
 */

$configPath = __DIR__ . '/config.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'status'  => 'error',
        'message' => 'Server misconfigured: config.php is missing. Copy config.sample.php to config.php and fill in your database credentials.',
    ]);
    exit;
}

require_once $configPath;

/**
 * Returns a shared PDO instance, creating it on first use.
 * Uses prepared-statement emulation OFF so real parameterized
 * queries are sent to MySQL (stronger protection against injection).
 */
function getDbConnection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        error_log('DB connection error: ' . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
        exit;
    }

    return $pdo;
}
