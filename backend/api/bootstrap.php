<?php

declare(strict_types=1);

/**
 * Shared bootstrap for every endpoint in this folder:
 * sets response headers, handles CORS preflight, and provides
 * small helper functions (send_json, get_json_body, sanitize_text).
 */

header('Content-Type: application/json; charset=utf-8');

// CORS — safe to leave open (*) since this API only ever returns
// public guestbook data / accepts public form submissions, nothing
// user-specific or authenticated. Tighten to your exact domain if
// you'd rather be stricter.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight requests end here with no body needed.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db.php';

/** Send a JSON response with the given HTTP status code and stop execution. */
function send_json(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

/** Decode a JSON request body into an associative array (empty array if invalid). */
function get_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode((string) $raw, true);
    return is_array($data) ? $data : [];
}

/** Trim whitespace and strip any HTML tags from user-supplied text. */
function sanitize_text(string $value): string
{
    return trim(strip_tags($value));
}
