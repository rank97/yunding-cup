-- ==============================================================================================
-- 云顶之弈电竞赛事管理中台 (TFT-TourneyOS) - 初始种子数据
-- ==============================================================================================
-- 包含：
--   1. 默认超级管理员账号 (admin / 123456)
--   2. 默认赛事主办方账号 (user / 123456)
--   3. 官方标准 8-7-6-5-4-3-2-1 积分规则
--   4. 吃鸡加权 9-7-6-5-4-3-2-1 积分规则
-- ==============================================================================================

-- 1. 默认超级管理员 (admin / 123456, 密码采用 BCrypt 存储)
INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
VALUES ('32e7f2c30155faf39e1efd121e8ced58', 'admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOh68LwgPc', 'SUPER_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(username) DO NOTHING;

-- 2. 默认主办方账号 (user / 123456, 密码采用 BCrypt 存储)
INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
VALUES ('88e7f2c30155faf39e1efd121e8ced99', 'user', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOh68LwgPc', 'ORGANIZER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(username) DO NOTHING;

-- 3. 默认官方 8-7-6-5-4-3-2-1 积分规则模板 (默认)
-- 第 1 名: 8分 | 第 2 名: 7分 | 第 3 名: 6分 | 第 4 名: 5分 | 第 5 名: 4分 | 第 6 名: 3分 | 第 7 名: 2分 | 第 8 名: 1分
INSERT INTO score_rules (id, tenant_id, rule_name, is_system_default, score_mapping, created_at)
VALUES ('1', 'GLOBAL', '官方标准积分规则 (8-7-6-5-4-3-2-1)', 1, '{"1":8,"2":7,"3":6,"4":5,"5":4,"6":3,"7":2,"8":1}', CURRENT_TIMESTAMP)
ON CONFLICT(id) DO NOTHING;

-- 4. 吃鸡加权 9-7-6-5-4-3-2-1 积分规则模板
-- 第 1 名: 9分 | 第 2 名: 7分 | 第 3 名: 6分 | 第 4 名: 5分 | 第 5 名: 4分 | 第 6 名: 3分 | 第 7 名: 2分 | 第 8 名: 1分
INSERT INTO score_rules (id, tenant_id, rule_name, is_system_default, score_mapping, created_at)
VALUES ('2', 'GLOBAL', '吃鸡加权积分规则 (9-7-6-5-4-3-2-1)', 0, '{"1":9,"2":7,"3":6,"4":5,"5":4,"6":3,"7":2,"8":1}', CURRENT_TIMESTAMP)
ON CONFLICT(id) DO NOTHING;
