<?php

declare(strict_types=1);

/**
 * POST /api/comments_delete.php
 * INPUT   -> { id, edit_token } JSON body
 * PROCESS -> validate -> DELETE where id AND edit_token both match
 * OUTPUT  -> 200 OK on success,
 *            400 Bad Request on invalid input,
 *            403 Forbidden if nothing matched (wrong token / already gone),
 *            500 Internal Server Error on failure
 */

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['status' => 'error', 'message' => 'Only POST is allowed.'], 405);
}

$input = get_json_body();

$id        = isset($input['id']) ? (int) $input['id'] : 0;
$editToken = isset($input['edit_token']) ? sanitize_text((string) $input['edit_token']) : '';

if ($id <= 0 || $editToken === '') {
    send_json(['status' => 'error', 'message' => 'id and edit_token are required.'], 400);
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare('DELETE FROM comments WHERE id = :id AND edit_token = :edit_token');
    $stmt->execute([':id' => $id, ':edit_token' => $editToken]);

    if ($stmt->rowCount() === 0) {
        send_json(['status' => 'error', 'message' => 'Comment not found or not yours to delete.'], 403);
    }

    send_json(['status' => 'success', 'message' => 'Comment deleted.'], 200);
} catch (PDOException $e) {
    error_log('comments_delete error: ' . $e->getMessage());
    send_json(['status' => 'error', 'message' => 'Could not delete comment.'], 500);
}
