<?php

declare(strict_types=1);

/**
 * POST /api/comments_create.php
 * INPUT   -> { name, comment } JSON body
 * PROCESS -> sanitize -> validate -> INSERT via prepared statement
 * OUTPUT  -> 201 Created with the new comment + a one-time edit_token,
 *            400 Bad Request on invalid input,
 *            500 Internal Server Error on failure
 */

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['status' => 'error', 'message' => 'Only POST is allowed.'], 405);
}

$input = get_json_body();

$name    = isset($input['name']) ? sanitize_text((string) $input['name']) : '';
$comment = isset($input['comment']) ? sanitize_text((string) $input['comment']) : '';

// Syntactic validation
if ($name === '' || $comment === '') {
    send_json(['status' => 'error', 'message' => 'Name and comment are both required.'], 400);
}

// Semantic validation
if (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
    send_json(['status' => 'error', 'message' => 'Name must be between 2 and 60 characters.'], 400);
}
if (mb_strlen($comment) < 2 || mb_strlen($comment) > 1000) {
    send_json(['status' => 'error', 'message' => 'Comment must be between 2 and 1000 characters.'], 400);
}

// A random per-comment secret. Returned once so the browser can prove
// ownership later when editing or deleting — never stored client-side
// in a way the server exposes again via the read endpoint.
$editToken = bin2hex(random_bytes(16));

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare(
        'INSERT INTO comments (name, comment, edit_token) VALUES (:name, :comment, :edit_token)'
    );
    $stmt->execute([
        ':name'       => $name,
        ':comment'    => $comment,
        ':edit_token' => $editToken,
    ]);

    $id = (int) $pdo->lastInsertId();

    send_json([
        'status'  => 'success',
        'message' => 'Comment posted!',
        'data'    => [
            'id'         => $id,
            'name'       => $name,
            'comment'    => $comment,
            'edit_token' => $editToken,
            'created_at' => date('c'),
        ],
    ], 201);
} catch (PDOException $e) {
    error_log('comments_create error: ' . $e->getMessage());
    send_json(['status' => 'error', 'message' => 'Could not save your comment.'], 500);
}
