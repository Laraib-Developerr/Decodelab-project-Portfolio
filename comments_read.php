<?php

declare(strict_types=1);

/**
 * GET /api/comments_read.php
 * INPUT   -> none
 * PROCESS -> SELECT all comments, newest first (edit_token deliberately excluded)
 * OUTPUT  -> 200 OK with an array of comments,
 *            500 Internal Server Error on failure
 */

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['status' => 'error', 'message' => 'Only GET is allowed.'], 405);
}

try {
    $pdo = getDbConnection();

    // edit_token is intentionally left out of the SELECT list so it
    // is never sent to the browser after the initial create response.
    $stmt = $pdo->query(
        'SELECT id, name, comment, created_at, updated_at FROM comments ORDER BY created_at DESC'
    );
    $comments = $stmt->fetchAll();

    send_json([
        'status' => 'success',
        'count'  => count($comments),
        'data'   => $comments,
    ], 200);
} catch (PDOException $e) {
    error_log('comments_read error: ' . $e->getMessage());
    send_json(['status' => 'error', 'message' => 'Could not load comments.'], 500);
}
