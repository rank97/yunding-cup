-- ========================================================
-- 云顶之弈电竞赛事管理系统 (TFT TourneyOS) MySQL 数据库初始化结构
-- ========================================================

CREATE DATABASE IF NOT EXISTS `yunding_cup` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `yunding_cup`;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `username` VARCHAR(64) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'ORGANIZER',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 积分规则模板表
CREATE TABLE IF NOT EXISTS `score_rules` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `tenant_id` VARCHAR(36) NOT NULL,
    `rule_name` VARCHAR(64) NOT NULL,
    `is_system_default` TINYINT DEFAULT 0,
    `score_mapping` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 赛事主表
CREATE TABLE IF NOT EXISTS `tournaments` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `tenant_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `total_players` INT NOT NULL,
    `share_code` VARCHAR(16) NOT NULL UNIQUE,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `current_stage_id` VARCHAR(36),
    `is_deleted` TINYINT NOT NULL DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_share_code` (`share_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 赛事选手花名册
CREATE TABLE IF NOT EXISTS `players` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `tournament_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `game_id` VARCHAR(64) NOT NULL,
    `avatar_url` VARCHAR(255),
    `initial_seed` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_tournament_game` (`tournament_id`, `game_id`),
    INDEX `idx_tournament_id` (`tournament_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 赛段配置表
CREATE TABLE IF NOT EXISTS `stages` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `tournament_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `stage_order` INT NOT NULL,
    `stage_type` VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    `round_count` INT NOT NULL DEFAULT 3,
    `direct_to_final_count` INT NOT NULL DEFAULT 0,
    `eliminate_count` INT NOT NULL DEFAULT 0,
    `inherit_scores` TINYINT NOT NULL DEFAULT 0,
    `max_round_limit` INT DEFAULT NULL,
    `score_rule_id` VARCHAR(36),
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `is_deleted` TINYINT NOT NULL DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tournament_stage` (`tournament_id`, `stage_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 赛段内选手状态与累计积分表
CREATE TABLE IF NOT EXISTS `stage_player_states` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `stage_id` VARCHAR(36) NOT NULL,
    `player_id` VARCHAR(36) NOT NULL,
    `carry_over_score` INT NOT NULL DEFAULT 0,
    `stage_score` INT NOT NULL DEFAULT 0,
    `total_score` INT NOT NULL DEFAULT 0,
    `first_place_count` INT NOT NULL DEFAULT 0,
    `top4_count` INT NOT NULL DEFAULT 0,
    `final_rank` INT,
    `advancement_status` VARCHAR(20) DEFAULT 'NONE',
    `is_match_point` TINYINT DEFAULT 0,
    UNIQUE KEY `uk_stage_player` (`stage_id`, `player_id`),
    INDEX `idx_stage_score` (`stage_id`, `total_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 赛段分组表
CREATE TABLE IF NOT EXISTS `stage_groups` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `stage_id` VARCHAR(36) NOT NULL,
    `group_name` VARCHAR(32) NOT NULL,
    `group_order` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_stage_group` (`stage_id`, `group_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.1 分组选手关联表
CREATE TABLE IF NOT EXISTS `stage_group_players` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `stage_group_id` VARCHAR(36) NOT NULL,
    `player_id` VARCHAR(36) NOT NULL,
    `seed_index` INT NOT NULL,
    UNIQUE KEY `uk_group_player` (`stage_group_id`, `player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 具体对局表
CREATE TABLE IF NOT EXISTS `match_rounds` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `stage_group_id` VARCHAR(36) NOT NULL,
    `round_number` INT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_group_round` (`stage_group_id`, `round_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 单局对局明细成绩表
CREATE TABLE IF NOT EXISTS `game_records` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `match_round_id` VARCHAR(36) NOT NULL,
    `player_id` VARCHAR(36) NOT NULL,
    `rank` INT NOT NULL,
    `score` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_round_rank` (`match_round_id`, `rank`),
    UNIQUE KEY `uk_round_player` (`match_round_id`, `player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
