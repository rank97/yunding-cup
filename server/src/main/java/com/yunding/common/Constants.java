package com.yunding.common;

/**
 * 云顶之弈电竞赛事系统全局通用常量定义
 *
 * @author TFT-TourneyOS Team
 */
public interface Constants {

    // ==========================================
    // 1. 用户权限与角色常量
    // ==========================================
    /**
     * 超级管理员角色（拥有全系统所有赛事查看、管理与删除权限）
     */
    String ROLE_SUPER_ADMIN = "SUPER_ADMIN";

    /**
     * 赛事主办方 / 裁判角色（普通注册用户，拥有创建与管理自身赛事的权限）
     */
    String ROLE_ORGANIZER = "ORGANIZER";

    // ==========================================
    // 2. 默认积分规则配置
    // ==========================================
    /**
     * 官方标准 8 选 1 积分映射 JSON：
     * 第 1 名: 8 分 | 第 2 名: 7 分 | 第 3 名: 6 分 | 第 4 名: 5 分 |
     * 第 5 名: 4 分 | 第 6 名: 3 分 | 第 7 名: 2 分 | 第 8 名: 1 分
     */
    String DEFAULT_SCORE_MAPPING = "{\"1\":8,\"2\":7,\"3\":6,\"4\":5,\"5\":4,\"6\":3,\"7\":2,\"8\":1}";

    // ==========================================
    // 3. 赛事主生命周期状态 (Tournament Status)
    // ==========================================
    /**
     * 赛事草稿待开赛（初始创建完成，可自由修改赛程流水与名册）
     */
    String TOURNAMENT_DRAFT = "DRAFT";

    /**
     * 赛事激烈进行中（已生成第一赛段分组或已产生有效小局比分）
     */
    String TOURNAMENT_IN_PROGRESS = "IN_PROGRESS";

    /**
     * 赛事圆满收官（总决赛冠军诞生，全赛程归档）
     */
    String TOURNAMENT_COMPLETED = "COMPLETED";

    // ==========================================
    // 4. 赛段生命周期状态 (Stage Status)
    // ==========================================
    /**
     * 待分桌（前序赛段尚未打完或本阶段尚未执行分池）
     */
    String STAGE_PENDING = "PENDING";

    /**
     * 已分桌（已生成 8 人房间及小局对局房，等待裁判开打录入）
     */
    String STAGE_GROUPED = "GROUPED";

    /**
     * 比赛进行中（已有部分小局完成成绩录入）
     */
    String STAGE_IN_PROGRESS = "IN_PROGRESS";

    /**
     * 赛段所有局数已打完（已就绪等待裁判结算锁定）
     */
    String STAGE_COMPLETED = "COMPLETED";

    /**
     * 赛段已锁定归档（已执行晋级结算，名单已下发流转至后续赛段）
     */
    String STAGE_LOCKED = "LOCKED";

    // ==========================================
    // 5. 赛段赛制类型 (Stage Type)
    // ==========================================
    /**
     * 标准固定局数赛制（如: 3局制、5局制，按总积分高低结算晋级/淘汰）
     */
    String STAGE_TYPE_STANDARD = "STANDARD";

    /**
     * 20 分赛点登顶夺冠制（决赛专属：累积分达 20 分开启赛点，赛点开启后后续局数吃鸡即可登顶封王）
     */
    String STAGE_TYPE_CHECKPOINT_FINAL = "CHECKPOINT_FINAL";

    // ==========================================
    // 6. 选手流转晋级状态 (Advancement Status)
    // ==========================================
    /**
     * 待定（比赛中，尚未最终锁定结算）
     */
    String ADVANCE_NONE = "NONE";

    /**
     * 成功晋级（流转进入下一常规赛段）
     */
    String ADVANCE_QUALIFIED = "ADVANCED";

    /**
     * 直通总决赛（保送通道，直接跨过中间赛段进入巅峰决赛组）
     */
    String ADVANCE_DIRECT_FINAL = "DIRECT_FINAL";

    /**
     * 遗憾淘汰（止步于当前赛段）
     */
    String ADVANCE_ELIMINATED = "ELIMINATED";

    /**
     * 夺得全球总冠军（决赛登顶）
     */
    String ADVANCE_CHAMPION = "CHAMPION";

    // ==========================================
    // 7. 房间单小局状态 (Round Status)
    // ==========================================
    /**
     * 待开打 / 待录入成绩
     */
    String ROUND_PENDING = "PENDING";

    /**
     * 对局进行中
     */
    String ROUND_PLAYING = "PLAYING";

    /**
     * 对局完赛（8 名选手名次与得分已录入完毕）
     */
    String ROUND_FINISHED = "FINISHED";
}
