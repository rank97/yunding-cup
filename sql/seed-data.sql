-- ========================================================
-- 默认初始种子数据 (初始管理员与标准默认积分规则)
-- ========================================================

-- 1. 默认超级管理员 (admin / 123456)
INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
VALUES ('32e7f2c30155faf39e1efd121e8ced58', 'admin', '123456', 'SUPER_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(username) DO NOTHING;

-- 2. 默认主办方账号 (user / 123456)
INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
VALUES ('88e7f2c30155faf39e1efd121e8ced99', 'user', '123456', 'ORGANIZER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(username) DO NOTHING;

-- 3. 默认官方 8-7-6-5-4-3-2-1 积分规则
INSERT INTO score_rules (id, tenant_id, rule_name, is_system_default, score_mapping, created_at)
VALUES ('1', 'GLOBAL', '官方标准积分规则 (8-7-6-5-4-3-2-1)', 1, '{"1":8,"2":7,"3":6,"4":5,"5":4,"6":3,"7":2,"8":1}', CURRENT_TIMESTAMP)
ON CONFLICT(id) DO NOTHING;
