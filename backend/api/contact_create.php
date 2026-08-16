<?php

declare(strict_types=1);

/**
 * POST /api/contact_create.php
 * INPUT   -> { name, email, message } JSON body
 * PROCESS -> sanitize -> validate (syntactic + semantic) -> INSERT
 * OUTPUT  -> 201 Created on success, 400 Bad Request on invalid input,
 *            500 Internal Server Error on failure
 *
 * Powers the Hire Me form. Kept separate from the guestbook table
 * since these submissions are private (only you should read them).
 */

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['status' => 'error', 'message' => 'Only POST is allowed.'], 405);
}

$input = get_json_body();

$name    = isset($input['name']) ? sanitize_text((string) $input['name']) : '';
$email   = isset($input['email']) ? strtolower(trim((string) $input['email'])) : '';
$message = isset($input['message']) ? sanitize_text((string) $input['message']) : '';

// Syntactic validation
if ($name === '' || $email === '' || $message === '') {
    send_json(['status' => 'error', 'message' => 'Name, email, and message are all required.'], 400);
}

// Semantic validation
if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    send_json(['status' => 'error', 'message' => 'Name must be between 2 and 100 characters.'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(['status' => 'error', 'message' => 'Please provide a valid email address.'], 400);
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 2000) {
    send_json(['status' => 'error', 'message' => 'Message must be between 10 and 2000 characters.'], 400);
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare(
        'INSERT INTO contact_submissions (name, email, message) VALUES (:name, :email, :message)'
    );
    $stmt->execute([':name' => $name, ':email' => $email, ':message' => $message]);

    send_json([
        'status'  => 'success',
        'message' => "Thanks, {$name}! Your message is in — I'll reply soon.",
    ], 201);
} catch (PDOException $e) {
    error_log('contact_create error: ' . $e->getMessage());
    send_json(['status' => 'error', 'message' => 'Something went wrong. Please try again.'], 500);
}
