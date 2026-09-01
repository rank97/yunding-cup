-- ==============================================================================================
-- 云顶之弈电竞赛事管理中台 (TFT-TourneyOS) - MySQL 数据库初始化建表脚本
-- ==============================================================================================
-- 适用版本：MySQL 5.7+ / 8.0+ / MariaDB
-- 字符集：utf8mb4 / utf8mb4_unicode_ci
-- ==============================================================================================

CREATE DATABASE IF NOT EXISTS `yunding_cup` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `yunding_cup`;

-- ----------------------------------------------------------------------------------------------
-- 1. 用户认证与权限表 (users)
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL COMMENT '用户唯一UUID主键',
    `username` VARCHAR(64) NOT NULL COMMENT '登录用户名',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'BCrypt加密密码散列值',
    `role` VARCHAR(20) NOT NULL DEFAULT 'ORGANIZER' COMMENT '角色权限: SUPER_ADMIN(超管) / ORGANIZER(主办方/裁判)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户认证与权限表';

-- ----------------------------------------------------------------------------------------------
-- 2. 积分规则模板表 (score_rules)
-- 定义名次与分数的映射关系：
--   - 官方标准积分模板: {"1":8,"2":7,"3":6,"4":5,"5":4,"6":3,"7":2,"8":1}
--   - 吃鸡加权积分模板: {"1":9,"2":7,"3":6,"4":5,"5":4,"6":3,"7":2,"8":1}
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `score_rules` (
    `id` VARCHAR(36) NOT NULL COMMENT '规则唯一UUID主键',
    `tenant_id` VARCHAR(36) NOT NULL COMMENT '所属租户/主办方ID (GLOBAL为系统公共规则)',
    `rule_name` VARCHAR(64) NOT NULL COMMENT '积分规则名称 (例: 官方标准积分 8-7-6-5-4-3-2-1)',
    `is_system_default` TINYINT DEFAULT 0 COMMENT '是否系统默认规则: 1-是, 0-否',
    `score_mapping` TEXT NOT NULL COMMENT 'JSON格式名次积分映射 (例: {"1":8,"2":7,...,"8":1})',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    INDEX `idx_score_rules_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分规则模板表';

-- ----------------------------------------------------------------------------------------------
-- 3. 赛事主表 (tournaments)
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tournaments` (
    `id` VARCHAR(36) NOT NULL COMMENT '赛事唯一UUID主键',
    `tenant_id` VARCHAR(36) NOT NULL COMMENT '赛事所属主办方用户ID',
    `title` VARCHAR(128) NOT NULL COMMENT '赛事名称',
    `total_players` INT NOT NULL COMMENT '赛事总参赛人数规模 (8/16/32/64/128)',
    `share_code` VARCHAR(16) NOT NULL COMMENT '8位大屏公开观赛码 (唯一索引)',
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '赛事状态: DRAFT(草稿) / IN_PROGRESS(进行中) / COMPLETED(已完赛)',
    `current_stage_id` VARCHAR(36) DEFAULT NULL COMMENT '当前正在进行中的赛段ID',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-正常, 1-已删除',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tournaments_share_code` (`share_code`),
    INDEX `idx_tournaments_tenant` (`tenant_id`),
    INDEX `idx_tournaments_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='赛事主信息表';

-- ----------------------------------------------------------------------------------------------
-- 4. 赛事选手花名册表 (players)
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `players` (
    `id` VARCHAR(36) NOT NULL COMMENT '选手唯一UUID主键',
    `tournament_id` VARCHAR(36) NOT NULL COMMENT '所属赛事ID',
    `name` VARCHAR(64) NOT NULL COMMENT '选手真实姓名/参赛称呼',
    `game_id` VARCHAR(64) NOT NULL COMMENT '游戏内ID (例: 虎牙丶红莲#1234)',
    `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '选手头像URL',
    `initial_seed` INT DEFAULT 0 COMMENT '初始种子顺位 (1~N, 用于初赛分池)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登记时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tournament_game_id` (`tournament_id`, `game_id`),
    INDEX `idx_players_tournament` (`tournament_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='赛事选手花名册表';

-- ----------------------------------------------------------------------------------------------
-- 5. 赛段配置主表 (stages)
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stages` (
    `id` VARCHAR(36) NOT NULL COMMENT '赛段唯一UUID主键',
    `tournament_id` VARCHAR(36) NOT NULL COMMENT '所属赛事ID',
    `name` VARCHAR(64) NOT NULL COMMENT '赛段名称 (例: 初赛、半决赛、总决赛)',
    `stage_order` INT NOT NULL COMMENT '赛段顺序序号 (1, 2, 3...)',
    `stage_type` VARCHAR(20) NOT NULL DEFAULT 'STANDARD' COMMENT '赛制类型: STANDARD(标准局数制) / CHECKPOINT_FINAL(20分赛点登顶制)',
    `round_count` INT NOT NULL DEFAULT 3 COMMENT '预设小局局数 (如: 3局制 / 5局制)',
    `direct_to_final_count` INT NOT NULL DEFAULT 0 COMMENT '直通总决赛保送人数 (0为无直通通道)',
    `eliminate_count` INT NOT NULL DEFAULT 0 COMMENT '末位淘汰人数',
    `inherit_scores` TINYINT NOT NULL DEFAULT 0 COMMENT '是否继承上一阶段底分: 1-继承, 0-清零',
    `max_round_limit` INT DEFAULT NULL COMMENT '赛点制最大局数熔断限制 (防止死循环)',
    `score_rule_id` VARCHAR(36) DEFAULT NULL COMMENT '积分规则模板ID',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING(待开赛) / GROUPED(已分组) / IN_PROGRESS(进行中) / COMPLETED(已完赛) / LOCKED(已锁定)',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-正常, 1-已删除',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_stages_tournament_order` (`tournament_id`, `stage_order`),
    INDEX `idx_stages_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='赛段配置主表';

-- ----------------------------------------------------------------------------------------------
-- 6. 赛段内选手状态与累计积分表 (stage_player_states)
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stage_player_states` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录唯一UUID主键',
    `stage_id` VARCHAR(36) NOT NULL COMMENT '赛段ID',
    `player_id` VARCHAR(36) NOT NULL COMMENT '选手ID',
    `carry_over_score` INT NOT NULL DEFAULT 0 COMMENT '上一赛段继承底分',
    `stage_score` INT NOT NULL DEFAULT 0 COMMENT '本赛段对局总得分',
    `total_score` INT NOT NULL DEFAULT 0 COMMENT '最终总积分 = carry_over_score + stage_score',
    `first_place_count` INT NOT NULL DEFAULT 0 COMMENT '吃鸡 (第1名) 次数',
    `top4_count` INT NOT NULL DEFAULT 0 COMMENT '前四名次数',
    `final_rank` INT DEFAULT NULL COMMENT '赛段完赛结算最终排名',
    `advancement_status` VARCHAR(20) DEFAULT 'NONE' COMMENT '流转状态: NONE(待定) / ADVANCED(晋级) / DIRECT_FINAL(直通决赛) / ELIMINATED(淘汰) / CHAMPION(总冠军)',
    `is_match_point` TINYINT DEFAULT 0 COMMENT '赛点标记: 1-已达20分赛点, 0-未达',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_stage_player` (`stage_id`, `player_id`),
    INDEX `idx_states_total_score` (`stage_id`, `total_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='赛段内选手状态与累计积分表';

-- ----------------------------------------------------------------------------------------------
-- 7. 赛段房间分组表 (stage_groups)
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stage_groups` (
    `id` VARCHAR(36) NOT NULL COMMENT '分组唯一UUID主键',
    `stage_id` VARCHAR(36) NOT NULL COMMENT '所属赛段ID',
    `group_name` VARCHAR(32) NOT NULL COMMENT '组别名称 (例: A 组, B 组, 决赛组)',
    `group_order` INT NOT NULL COMMENT '组别序号 (1, 2, 3...)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    INDEX `idx_groups_stage` (`stage_id`, `group_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='赛段房间分组表';

-- ----------------------------------------------------------------------------------------------
-- 7.1 分组选手席位排布表 (stage_group_players)
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stage_group_players` (
    `id` VARCHAR(36) NOT NULL COMMENT '席位唯一UUID主键',
    `stage_group_id` VARCHAR(36) NOT NULL COMMENT '所属房间分组ID',
    `player_id` VARCHAR(36) NOT NULL COMMENT '入座选手ID',
    `seed_index` INT NOT NULL COMMENT '分池种子顺位序号 (1~N, 决定蛇形分池)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_group_player` (`stage_group_id`, `player_id`),
    INDEX `idx_group_players_group` (`stage_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分组选手席位排布表';

-- ----------------------------------------------------------------------------------------------
-- 8. 房间小局对局表 (match_rounds)
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `match_rounds` (
    `id` VARCHAR(36) NOT NULL COMMENT '小局唯一UUID主键',
    `stage_group_id` VARCHAR(36) NOT NULL COMMENT '所属房间分组ID',
    `round_number` INT NOT NULL COMMENT '第几小局 (1, 2, 3...)',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '对局状态: PENDING(待开赛) / PLAYING(进行中) / FINISHED(已完赛)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_group_round` (`stage_group_id`, `round_number`),
    INDEX `idx_match_rounds_group` (`stage_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房间小局对局表';

-- ----------------------------------------------------------------------------------------------
-- 9. 单局 8 名选手名次与得分明细表 (game_records)
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `game_records` (
    `id` VARCHAR(36) NOT NULL COMMENT '成绩唯一UUID主键',
    `match_round_id` VARCHAR(36) NOT NULL COMMENT '所属小局ID',
    `player_id` VARCHAR(36) NOT NULL COMMENT '选手ID',
    `rank` INT NOT NULL COMMENT '落位名次 (1 ~ 8)',
    `score` INT NOT NULL COMMENT '该名次对应得分',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '录入时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_round_rank` (`match_round_id`, `rank`),
    UNIQUE KEY `uk_round_player` (`match_round_id`, `player_id`),
    INDEX `idx_records_round` (`match_round_id`),
    INDEX `idx_records_player` (`player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单局选手名次与得分明细表';
