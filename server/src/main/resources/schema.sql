-- ==============================================================================================
-- 云顶之弈电竞赛事管理中台 (TFT-TourneyOS) - SQLite 数据库结构定义
-- ==============================================================================================
-- 描述：包含用户权限、赛事主表、多阶段流水配置、蛇形分组排布、各局战报及选手累计积分等核心表结构。
-- 编码：UTF-8
-- ==============================================================================================

-- ----------------------------------------------------------------------------------------------
-- 1. 用户认证与权限表 (users)
-- 存储超级管理员、主办方/裁判账号信息及密码哈希（BCrypt 加密）。
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,                         -- 用户唯一主键 (UUID)
    username VARCHAR(64) NOT NULL UNIQUE,               -- 登录用户名 (唯一索引)
    password_hash VARCHAR(255) NOT NULL,                -- BCrypt 加密后的密码散列值
    role VARCHAR(20) NOT NULL DEFAULT 'ORGANIZER',      -- 角色权限: SUPER_ADMIN(超管) / ORGANIZER(主办方/裁判)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 账号创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP       -- 账号更新时间
);

-- ----------------------------------------------------------------------------------------------
-- 2. 积分规则模板表 (score_rules)
-- 定义名次与分数的映射关系：
--   - 官方标准积分模板: {"1":8,"2":7,"3":6,"4":5,"5":4,"6":3,"7":2,"8":1}
--   - 吃鸡加权积分模板: {"1":9,"2":7,"3":6,"4":5,"5":4,"6":3,"7":2,"8":1}
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS score_rules (
    id VARCHAR(36) PRIMARY KEY,                         -- 规则唯一主键 (UUID)
    tenant_id VARCHAR(36) NOT NULL,                     -- 所属租户/创建者 ID (GLOBAL 为系统公共规则)
    rule_name VARCHAR(64) NOT NULL,                     -- 规则名称 (如: 官方标准积分 8-7-6-5-4-3-2-1)
    is_system_default INTEGER DEFAULT 0,                -- 是否系统默认规则: 1-是, 0-否
    score_mapping TEXT NOT NULL,                        -- JSON 格式名次积分映射 (例: {"1":8,"2":7,...,"8":1})
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP       -- 规则创建时间
);

-- ----------------------------------------------------------------------------------------------
-- 3. 赛事主表 (tournaments)
-- 赛事的顶层实体，定义赛事基本信息、总参赛人数与 8 位大屏公开观赛码。
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournaments (
    id VARCHAR(36) PRIMARY KEY,                         -- 赛事唯一主键 (UUID)
    tenant_id VARCHAR(36) NOT NULL,                     -- 赛事所属主办方/创建者 ID
    title VARCHAR(128) NOT NULL,                        -- 赛事名称 (例: 2026 第一届云顶之弈月亮杯)
    total_players INTEGER NOT NULL,                     -- 赛事总规模 (8 / 16 / 32 / 64 / 128 人)
    share_code VARCHAR(16) NOT NULL UNIQUE,             -- 8 位大屏公开观赛码 (唯一索引，如: WW4U9JCU)
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',        -- 状态: DRAFT(草稿) / IN_PROGRESS(进行中) / COMPLETED(完赛)
    current_stage_id VARCHAR(36),                       -- 当前正在进行的赛段 ID
    is_deleted INTEGER NOT NULL DEFAULT 0,              -- 逻辑删除标识: 0-正常, 1-已删除
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 赛事创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP       -- 赛事最后更新时间
);

-- ----------------------------------------------------------------------------------------------
-- 4. 赛事选手花名册表 (players)
-- 登记参与该场赛事的所有选手基础信息与初始种子序号。
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(36) PRIMARY KEY,                         -- 选手唯一主键 (UUID)
    tournament_id VARCHAR(36) NOT NULL,                 -- 所属赛事 ID
    name VARCHAR(64) NOT NULL,                          -- 选手真实姓名 / 参赛称呼
    game_id VARCHAR(64) NOT NULL,                       -- 游戏内 ID (如: 虎牙丶红莲#1234)
    avatar_url VARCHAR(255),                            -- 选手头像 URL (可选)
    initial_seed INTEGER DEFAULT 0,                     -- 初始种子顺位 (1~N, 用于第一赛段初始蛇形分池)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 选手登记时间
    UNIQUE(tournament_id, game_id)                      -- 同一场比赛内游戏 ID 不可重复
);

-- ----------------------------------------------------------------------------------------------
-- 5. 赛段配置主表 (stages)
-- 赛事的流转阶段配置（如: 初赛、半决赛、突围复活赛、20分登顶巅峰总决赛）。
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stages (
    id VARCHAR(36) PRIMARY KEY,                         -- 赛段唯一主键 (UUID)
    tournament_id VARCHAR(36) NOT NULL,                 -- 所属赛事 ID
    name VARCHAR(64) NOT NULL,                          -- 赛段名称 (例: 初赛 (32进24)、总决赛 (20分登顶))
    stage_order INTEGER NOT NULL,                       -- 赛段序号 (从 1 开始顺序流转)
    stage_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD', -- 赛制类型: STANDARD(标准局数制) / CHECKPOINT_FINAL(20分赛点登顶制)
    round_count INTEGER NOT NULL DEFAULT 3,             -- 赛段预设比赛局数 (如: 3局制 / 5局制)
    direct_to_final_count INTEGER NOT NULL DEFAULT 0,   -- 直通总决赛保送人数 (0 为无直通通道)
    eliminate_count INTEGER NOT NULL DEFAULT 0,         -- 赛段末位淘汰人数
    inherit_scores INTEGER NOT NULL DEFAULT 0,          -- 是否继承前一阶段底分: 1-继承, 0-清零重计
    max_round_limit INTEGER DEFAULT NULL,               -- 赛点制最大局数熔断上限 (防止无限死循环)
    score_rule_id VARCHAR(36),                          -- 本赛段使用的积分规则 ID
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',      -- 赛段状态: PENDING(待开赛) / GROUPED(已分组) / IN_PROGRESS(进行中) / COMPLETED(已完赛) / LOCKED(已锁定归档)
    is_deleted INTEGER NOT NULL DEFAULT 0,              -- 逻辑删除标识: 0-正常, 1-已删除
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 赛段创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP       -- 赛段最后更新时间
);

-- ----------------------------------------------------------------------------------------------
-- 6. 赛段内选手状态与累计积分表 (stage_player_states)
-- 记录选手在具体某一赛段的累积总分、小局得分、吃鸡数、前四数、赛点标记与晋级/淘汰结算状态。
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stage_player_states (
    id VARCHAR(36) PRIMARY KEY,                         -- 记录唯一主键 (UUID)
    stage_id VARCHAR(36) NOT NULL,                      -- 赛段 ID
    player_id VARCHAR(36) NOT NULL,                     -- 选手 ID
    carry_over_score INTEGER NOT NULL DEFAULT 0,        -- 继承自上一阶段的底分
    stage_score INTEGER NOT NULL DEFAULT 0,             -- 本赛段所有小局比赛获得的总分
    total_score INTEGER NOT NULL DEFAULT 0,             -- 最终总积分 = carry_over_score + stage_score
    first_place_count INTEGER NOT NULL DEFAULT 0,       -- 本赛段吃鸡 (第1名) 次数 (第1顺位同分决胜指标)
    top4_count INTEGER NOT NULL DEFAULT 0,              -- 本赛段前四名进入次数 (第2顺位同分决胜指标)
    final_rank INTEGER,                                 -- 本赛段完赛结算后的最终排名
    advancement_status VARCHAR(20) DEFAULT 'NONE',      -- 晋级流转状态: NONE(待定) / ADVANCED(晋级) / DIRECT_FINAL(直通决赛) / ELIMINATED(淘汰) / CHAMPION(总冠军)
    is_match_point INTEGER DEFAULT 0,                   -- 赛点触发标记: 1-已达20分赛点(下局吃鸡夺冠), 0-未触发
    UNIQUE(stage_id, player_id)                         -- 同一赛段内选手的状态记录唯一
);

-- ----------------------------------------------------------------------------------------------
-- 7. 赛段房间分组表 (stage_groups)
-- 每个赛段按 8 人一桌切分出的比赛房间（A 组、B 组、C 组...）。
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stage_groups (
    id VARCHAR(36) PRIMARY KEY,                         -- 分组唯一主键 (UUID)
    stage_id VARCHAR(36) NOT NULL,                      -- 所属赛段 ID
    group_name VARCHAR(32) NOT NULL,                    -- 组别名称 (例: A 组, B 组, 决赛组)
    group_order INTEGER NOT NULL,                       -- 组别排列序号 (1, 2, 3...)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP       -- 房间创建时间
);

-- ----------------------------------------------------------------------------------------------
-- 7.1 分组选手席位排布表 (stage_group_players)
-- 记录房间内 8 名选手的座次分池与蛇形种子索引 (seed_index)。
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stage_group_players (
    id VARCHAR(36) PRIMARY KEY,                         -- 席位记录唯一主键 (UUID)
    stage_group_id VARCHAR(36) NOT NULL,                -- 所属房间分组 ID
    player_id VARCHAR(36) NOT NULL,                     -- 入座选手 ID
    seed_index INTEGER NOT NULL,                        -- 本阶段分池种子序号 (1~N, 决定蛇形分桌位置)
    UNIQUE(stage_group_id, player_id)                   -- 同一房间内选手不重复入座
);

-- ----------------------------------------------------------------------------------------------
-- 8. 房间小局对局表 (match_rounds)
-- 记录房间内进行的第 R1 ~ Rn 局比赛状态（如: R1-已完赛, R2-进行中）。
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_rounds (
    id VARCHAR(36) PRIMARY KEY,                         -- 小局唯一主键 (UUID)
    stage_group_id VARCHAR(36) NOT NULL,                -- 所属房间分组 ID
    round_number INTEGER NOT NULL,                      -- 第几小局 (1, 2, 3...)
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',      -- 对局状态: PENDING(待开赛) / PLAYING(进行中) / FINISHED(已完赛)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 对局创建时间
    UNIQUE(stage_group_id, round_number)                -- 同一房间小局号唯一
);

-- ----------------------------------------------------------------------------------------------
-- 9. 单局 8 名选手名次与得分明细表 (game_records)
-- 存储裁判录入的具体某一小局 1~8 名选手的落位成绩与获得积分。
-- ----------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_records (
    id VARCHAR(36) PRIMARY KEY,                         -- 成绩记录唯一主键 (UUID)
    match_round_id VARCHAR(36) NOT NULL,                -- 所属小局 ID
    player_id VARCHAR(36) NOT NULL,                     -- 选手 ID
    rank INTEGER NOT NULL,                              -- 实际名次 (1 ~ 8)
    score INTEGER NOT NULL,                             -- 该名次对应获得的积分 (如: 8, 7, 6...)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 录入时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 更新时间
    UNIQUE(match_round_id, rank),                       -- 单局内名次 1~8 唯一（不可出现并列名次）
    UNIQUE(match_round_id, player_id)                   -- 单局内每个选手仅有一条成绩记录
);
