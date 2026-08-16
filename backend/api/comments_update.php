<?php

declare(strict_types=1);

/**
 * POST /api/comments_update.php
 * INPUT   -> { id, edit_token, comment } JSON body
 * PROCESS -> validate -> confirm the edit_token owns this comment -> UPDATE
 * OUTPUT  -> 200 OK on success,
 *            400 Bad Request on invalid input,
 *            403 Forbidden if the token doesn't match the comment,
 *            500 Internal Server Error on failure
 *
 * Note: plain POST is used (not PUT) because some shared-hosting
 * environments, including InfinityFree's, can block non-standard
 * HTTP methods at the server/firewall level.
 */

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['status' => 'error', 'message' => 'Only POST is allowed.'], 405);
}

$input = get_json_body();

$id        = isset($input['id']) ? (int) $input['id'] : 0;
$editToken = isset($input['edit_token']) ? sanitize_text((string) $input['edit_token']) : '';
$comment   = isset($input['comment']) ? sanitize_text((string) $input['comment']) : '';

if ($id <= 0 || $editToken === '' || $comment === '') {
    send_json(['status' => 'error', 'message' => 'id, edit_token, and comment are required.'], 400);
}
if (mb_strlen($comment) < 2 || mb_strlen($comment) > 1000) {
    send_json(['status' => 'error', 'message' => 'Comment must be between 2 and 1000 characters.'], 400);
}

try {
    $pdo = getDbConnection();

    // Confirm this token actually owns the comment before touching it.
    $check = $pdo->prepare('SELECT id FROM comments WHERE id = :id AND edit_token = :edit_token');
    $check->execute([':id' => $id, ':edit_token' => $editToken]);

    if (!$check->fetch()) {
        send_json(['status' => 'error', 'message' => 'You can only edit your own comment.'], 403);
    }

    $stmt = $pdo->prepare(
        'UPDATE comments SET comment = :comment WHERE id = :id AND edit_token = :edit_token'
    );
    $stmt->execute([
        ':comment'    => $comment,
        ':id'         => $id,
        ':edit_token' => $editToken,
    ]);

    send_json(['status' => 'success', 'message' => 'Comment updated.'], 200);
} catch (PDOException $e) {
    error_log('comments_update error: ' . $e->getMessage());
    send_json(['status' => 'error', 'message' => 'Could not update your comment.'], 500);
}
