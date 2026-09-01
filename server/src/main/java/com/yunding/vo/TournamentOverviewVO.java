package com.yunding.vo;

import lombok.Data;

import java.util.List;

/**
 * 赛事全景流水大屏导图视图对象 (TournamentOverviewVO)
 * <p>
 * 为电竞转播大屏与观众导图提供左右横向推进的赛程流转树、各房间选手席位与终点冠军王座数据。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class TournamentOverviewVO {

    /**
     * 赛事 ID
     */
    private String id;

    /**
     * 赛事标题
     */
    private String title;

    /**
     * 参赛总人数规模 (8/16/32/64/128)
     */
    private Integer totalPlayers;

    /**
     * 8 位公开观赛分享码
     */
    private String shareCode;

    /**
     * 赛事状态 (DRAFT, IN_PROGRESS, COMPLETED)
     */
    private String status;

    /**
     * 当前正在进行的赛段 ID
     */
    private String currentStageId;

    /**
     * 当前正在进行的赛段名称
     */
    private String currentStageName;

    /**
     * 多阶段流水导图各列节点列表 (按 stageOrder 排序)
     */
    private List<StageColumnVO> columns;

    /**
     * 终点冠军王座信息 (已夺冠时包含冠军选手，未夺冠时包含赛点候选人)
     */
    private ChampionThroneVO championThrone;

    /**
     * 单个赛段流水列视图
     */
    @Data
    public static class StageColumnVO {
        private String stageId;
        private String name;
        private Integer stageOrder;
        private String stageType; // STANDARD, CHECKPOINT_FINAL
        private Integer roundCount;
        private Integer inputPlayers;
        private Integer directToFinalCount;
        private Integer eliminateCount;
        private Integer inheritScores;
        private String scoreRuleId;
        private String scoreRuleName;
        private String status; // PENDING, GROUPED, IN_PROGRESS, COMPLETED, LOCKED
        private List<GroupNodeVO> groups;
    }

    /**
     * 房间分组节点视图
     */
    @Data
    public static class GroupNodeVO {
        private String groupId;
        private String groupName;
        private List<PlayerSlotVO> slots; // 8 个固定席位
    }

    /**
     * 8 人房间内单个席位视图（支持真实入座选手与未开赛虚位以待占位卡）
     */
    @Data
    public static class PlayerSlotVO {
        private String playerId;
        private String name;
        private String gameId;
        private String avatarUrl;
        private Integer seedIndex;
        private Integer currentScore;
        private Integer firstPlaces;
        private Integer top4s;
        private Integer isMatchPoint;
        private String advancementStatus; // NONE, ADVANCED, DIRECT_FINAL, ELIMINATED, CHAMPION
        private Boolean isPlaceholder;    // true: 虚位以待 (待前序赛段流转)
        private String placeholderDesc;   // 如: "来源: 半决赛 5~20 名"
    }

    /**
     * 终点巅峰冠军王座视图
     */
    @Data
    public static class ChampionThroneVO {
        private Boolean isDetermined;
        private String championPlayerId;
        private String championName;
        private String championGameId;
        private String championAvatarUrl;
        private Integer totalScore;
        private Integer winningRound; // 决胜吃鸡夺冠小局号 (如: 第 5 局)
        private List<String> matchPointCandidateNames; // 当前已达到 20 分开启赛点的候选人名单
    }
}
