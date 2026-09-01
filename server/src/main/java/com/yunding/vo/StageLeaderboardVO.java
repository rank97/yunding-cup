package com.yunding.vo;

import lombok.Data;

import java.util.List;

/**
 * 阶段积分排行榜视图对象 (StageLeaderboardVO)
 * <p>
 * 提供赛段选手排位、底分继承、积分规则、R1~Rn 每局小局得分、吃鸡数/前四数统计与晋级状态数据。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class StageLeaderboardVO {

    /**
     * 赛段 ID
     */
    private String stageId;

    /**
     * 赛段名称
     */
    private String stageName;

    /**
     * 赛段序号
     */
    private Integer stageOrder;

    /**
     * 赛制类型 (STANDARD / CHECKPOINT_FINAL)
     */
    private String stageType;

    /**
     * 比赛局数
     */
    private Integer roundCount;

    /**
     * 直通总决赛名额
     */
    private Integer directToFinalCount;

    /**
     * 末位淘汰名额
     */
    private Integer eliminateCount;

    /**
     * 是否继承底分
     */
    private Integer inheritScores;

    /**
     * 积分规则 ID
     */
    private String scoreRuleId;

    /**
     * 积分规则名称 (例: 官方标准积分规则 (8-7-6-5-4-3-2-1) / 吃鸡加权积分规则 (9-7-6-5-4-3-2-1))
     */
    private String scoreRuleName;

    /**
     * 赛段状态
     */
    private String status;

    /**
     * 选手积分榜各行数据列表 (已按同分决胜规则严格排序)
     */
    private List<LeaderboardRowVO> rows;

    /**
     * 单个选手的积分排行榜行数据
     */
    @Data
    public static class LeaderboardRowVO {
        private Integer rank;              // 名次 (1 ~ N)
        private String playerId;           // 选手 ID
        private String name;               // 选手姓名
        private String gameId;             // 游戏内 ID
        private String avatarUrl;          // 头像 URL
        private String groupName;          // 所属房间组名 (如: A组)
        private Integer carryOverScore;    // 继承上一阶段的底分
        private List<Integer> roundScores; // R1, R2, R3... 各局实得分数 (未开赛局为 null)
        private Integer firstPlaceCount;   // 吃鸡次数
        private Integer top4Count;         // 前四次数
        private Integer stageScore;        // 本赛段对局总得分
        private Integer totalScore;        // 最终总积分
        private String advancementStatus;  // 流转状态: NONE, ADVANCED, DIRECT_FINAL, ELIMINATED, CHAMPION
        private Integer isMatchPoint;      // 赛点标记: 1-开启赛点, 0-未开启
    }
}
