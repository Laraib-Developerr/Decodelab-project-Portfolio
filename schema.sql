-- ===========================================================
-- LARAIB PORTFOLIO — DATABASE SCHEMA
-- MySQL / MariaDB (InfinityFree-compatible)
--
-- Import this via phpMyAdmin in the InfinityFree control panel:
-- Client Area -> MySQL Databases -> your DB -> phpMyAdmin -> Import
-- ===========================================================

-- Footer guestbook comments.
-- edit_token is a per-comment secret (never shown after creation)
-- that lets the original browser prove ownership for update/delete.
CREATE TABLE IF NOT EXISTS comments (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL,
  comment    TEXT         NOT NULL,
  edit_token CHAR(32)     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_comments_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hire Me form submissions (private — not displayed on the site).
CREATE TABLE IF NOT EXISTS contact_submissions (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(254) NOT NULL,
  message    TEXT         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
