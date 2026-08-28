package com.yunding.vo;

import lombok.Data;
import java.util.List;

@Data
public class TournamentOverviewVO {
    private String id;
    private String title;
    private Integer totalPlayers;
    private String shareCode;
    private String status;
    private String currentStageId;
    private String currentStageName;

    // 左右推进的多列导图结构
    private List<StageColumnVO> columns;

    // 终点：总冠军王座
    private ChampionThroneVO championThrone;

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
        private String status; // PENDING, GROUPED, IN_PROGRESS, COMPLETED, LOCKED
        private List<GroupNodeVO> groups;
    }

    @Data
    public static class GroupNodeVO {
        private String groupId;
        private String groupName;
        private List<PlayerSlotVO> slots; // 8 个席位
    }

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
        private Boolean isPlaceholder; // true: 虚位以待
        private String placeholderDesc; // "来源: 半决赛 5~20 名"
    }

    @Data
    public static class ChampionThroneVO {
        private Boolean isDetermined;
        private String championPlayerId;
        private String championName;
        private String championGameId;
        private String championAvatarUrl;
        private Integer totalScore;
        private Integer winningRound; // 决胜局
        private List<String> matchPointCandidateNames; // 潜在赛点候选人列表
    }
}
