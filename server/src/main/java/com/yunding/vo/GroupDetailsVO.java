package com.yunding.vo;

import lombok.Data;
import java.util.List;

@Data
public class GroupDetailsVO {
    private String stageId;
    private List<GroupRowVO> groups;

    @Data
    public static class GroupRowVO {
        private String groupId;
        private String groupName;
        private List<RoundCardVO> rounds; // R1..Rx 单局卡片列表
    }

    @Data
    public static class RoundCardVO {
        private String matchRoundId;
        private Integer roundNumber; // 1, 2, 3...
        private String status; // PENDING, PLAYING, FINISHED
        private List<PlayerRankItemVO> rankings; // 1~8 名排名列表
    }

    @Data
    public static class PlayerRankItemVO {
        private Integer rank; // 1~8
        private String playerId;
        private String name;
        private String gameId;
        private String avatarUrl;
        private Integer score;
        private Boolean isMatchPoint;
    }
}
