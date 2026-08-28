-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ORGANIZER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 积分规则模板表
CREATE TABLE IF NOT EXISTS score_rules (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    rule_name VARCHAR(64) NOT NULL,
    is_system_default INTEGER DEFAULT 0,
    score_mapping TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 赛事主表
CREATE TABLE IF NOT EXISTS tournaments (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    title VARCHAR(128) NOT NULL,
    total_players INTEGER NOT NULL,
    share_code VARCHAR(16) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    current_stage_id VARCHAR(36),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 赛事选手花名册
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(36) PRIMARY KEY,
    tournament_id VARCHAR(36) NOT NULL,
    name VARCHAR(64) NOT NULL,
    game_id VARCHAR(64) NOT NULL,
    avatar_url VARCHAR(255),
    initial_seed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, game_id)
);

-- 5. 赛段配置表
CREATE TABLE IF NOT EXISTS stages (
    id VARCHAR(36) PRIMARY KEY,
    tournament_id VARCHAR(36) NOT NULL,
    name VARCHAR(64) NOT NULL,
    stage_order INTEGER NOT NULL,
    stage_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    round_count INTEGER NOT NULL DEFAULT 3,
    direct_to_final_count INTEGER NOT NULL DEFAULT 0,
    eliminate_count INTEGER NOT NULL DEFAULT 0,
    inherit_scores INTEGER NOT NULL DEFAULT 0,
    max_round_limit INTEGER DEFAULT NULL,
    score_rule_id VARCHAR(36),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 赛段内选手状态与累计积分表
CREATE TABLE IF NOT EXISTS stage_player_states (
    id VARCHAR(36) PRIMARY KEY,
    stage_id VARCHAR(36) NOT NULL,
    player_id VARCHAR(36) NOT NULL,
    carry_over_score INTEGER NOT NULL DEFAULT 0,
    stage_score INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    first_place_count INTEGER NOT NULL DEFAULT 0,
    top4_count INTEGER NOT NULL DEFAULT 0,
    final_rank INTEGER,
    advancement_status VARCHAR(20) DEFAULT 'NONE',
    is_match_point INTEGER DEFAULT 0,
    UNIQUE(stage_id, player_id)
);

-- 7. 赛段分组表
CREATE TABLE IF NOT EXISTS stage_groups (
    id VARCHAR(36) PRIMARY KEY,
    stage_id VARCHAR(36) NOT NULL,
    group_name VARCHAR(32) NOT NULL,
    group_order INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7.1 分组选手关联表
CREATE TABLE IF NOT EXISTS stage_group_players (
    id VARCHAR(36) PRIMARY KEY,
    stage_group_id VARCHAR(36) NOT NULL,
    player_id VARCHAR(36) NOT NULL,
    seed_index INTEGER NOT NULL,
    UNIQUE(stage_group_id, player_id)
);

-- 8. 具体对局表
CREATE TABLE IF NOT EXISTS match_rounds (
    id VARCHAR(36) PRIMARY KEY,
    stage_group_id VARCHAR(36) NOT NULL,
    round_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stage_group_id, round_number)
);

-- 9. 单局对局明细成绩表
CREATE TABLE IF NOT EXISTS game_records (
    id VARCHAR(36) PRIMARY KEY,
    match_round_id VARCHAR(36) NOT NULL,
    player_id VARCHAR(36) NOT NULL,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_round_id, rank),
    UNIQUE(match_round_id, player_id)
);
