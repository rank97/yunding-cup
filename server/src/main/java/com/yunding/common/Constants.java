package com.yunding.common;

public interface Constants {
    // 角色定义
    String ROLE_SUPER_ADMIN = "SUPER_ADMIN";
    String ROLE_ORGANIZER = "ORGANIZER";

    // 默认积分规则 JSON
    String DEFAULT_SCORE_MAPPING = "{\"1\":8,\"2\":7,\"3\":6,\"4\":5,\"5\":4,\"3\":3,\"2\":2,\"1\":1,\"8\":1,\"7\":2,\"6\":3,\"5\":4,\"4\":5,\"3\":6,\"2\":7,\"1\":8}";

    // 赛事状态
    String TOURNAMENT_DRAFT = "DRAFT";
    String TOURNAMENT_IN_PROGRESS = "IN_PROGRESS";
    String TOURNAMENT_COMPLETED = "COMPLETED";

    // 赛段状态
    String STAGE_PENDING = "PENDING";
    String STAGE_GROUPED = "GROUPED";
    String STAGE_IN_PROGRESS = "IN_PROGRESS";
    String STAGE_COMPLETED = "COMPLETED";
    String STAGE_LOCKED = "LOCKED";

    // 晋级状态
    String ADVANCE_NONE = "NONE";
    String ADVANCE_QUALIFIED = "ADVANCED";
    String ADVANCE_DIRECT_FINAL = "DIRECT_FINAL";
    String ADVANCE_ELIMINATED = "ELIMINATED";
    String ADVANCE_CHAMPION = "CHAMPION";

    // 对局状态
    String ROUND_PENDING = "PENDING";
    String ROUND_PLAYING = "PLAYING";
    String ROUND_FINISHED = "FINISHED";
}
