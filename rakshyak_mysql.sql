-- ══════════════════════════════════════════════════════════════════
--  RAKSHYAK – MySQL Schema for XAMPP
--  Import this in phpMyAdmin:
--    1. Open http://localhost/phpmyadmin
--    2. Click "New" → create database named: rakshyak
--    3. Select the database → click "Import" → choose this file → Go
-- ══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS `rakshyak`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `rakshyak`;

-- ── USERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`          VARCHAR(36)   NOT NULL,
  `name`        VARCHAR(120)  NOT NULL,
  `phone`       VARCHAR(20)   NOT NULL,
  `email`       VARCHAR(120)  DEFAULT NULL,
  `pass_hash`   VARCHAR(255)  NOT NULL,           -- btoa(pass) from app
  `contacts`    TEXT          DEFAULT '[]',        -- JSON array [{name, phone}]
  `created_at`  BIGINT        NOT NULL DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_phone` (`phone`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── ALERTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `alerts` (
  `id`          VARCHAR(80)   NOT NULL,
  `user_id`     VARCHAR(36)   NOT NULL,
  `user_name`   VARCHAR(120)  NOT NULL,
  `user_phone`  VARCHAR(20)   NOT NULL,
  `lat`         DOUBLE        DEFAULT NULL,
  `lng`         DOUBLE        DEFAULT NULL,
  `accuracy`    DOUBLE        DEFAULT NULL,
  `photo`       MEDIUMTEXT    DEFAULT NULL,        -- base64 JPEG
  `online`      TINYINT(1)    NOT NULL DEFAULT 1,
  `contacts`    TEXT          DEFAULT '[]',
  `timestamp`   BIGINT        NOT NULL,
  `resolved`    TINYINT(1)    NOT NULL DEFAULT 0,
  `resolved_at` BIGINT        DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id`   (`user_id`),
  KEY `idx_timestamp` (`timestamp` DESC),
  KEY `idx_resolved`  (`resolved`),
  CONSTRAINT `fk_alerts_users`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── VIEWS ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW `active_alerts` AS
  SELECT a.*, u.email
  FROM   `alerts` a
  JOIN   `users`  u ON u.id = a.user_id
  WHERE  a.resolved = 0
  ORDER  BY a.timestamp DESC;

CREATE OR REPLACE VIEW `alert_history` AS
  SELECT a.*, u.email,
         ROUND((a.resolved_at - a.timestamp) / 60000.0, 1) AS response_minutes
  FROM   `alerts` a
  JOIN   `users`  u ON u.id = a.user_id
  WHERE  a.resolved = 1
  ORDER  BY a.timestamp DESC;
