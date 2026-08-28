package com.yunding.vo;

import lombok.Data;
import java.util.List;

@Data
public class StageLeaderboardVO {
    private String stageId;
    private String stageName;
    private Integer stageOrder;
    private String stageType;
    private Integer roundCount;
    private Integer directToFinalCount;
    private Integer eliminateCount;
    private Integer inheritScores;
    private String status;

    private List<LeaderboardRowVO> rows;

    @Data
    public static class LeaderboardRowVO {
        private Integer rank;
        private String playerId;
        private String name;
        private String gameId;
        private String avatarUrl;
        private String groupName;
        private Integer carryOverScore;
        private List<Integer> roundScores; // R1, R2, R3...
        private Integer firstPlaceCount;
        private Integer top4Count;
        private Integer stageScore;
        private Integer totalScore;
        private String advancementStatus; // NONE, ADVANCED, DIRECT_FINAL, ELIMINATED, CHAMPION
        private Integer isMatchPoint;
    }
}
