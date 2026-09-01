package com.yunding.vo;

import lombok.Data;

import java.util.List;

/**
 * 房间分组与各局战报明细视图对象 (GroupDetailsVO)
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class GroupDetailsVO {

    /**
     * 赛段 ID
     */
    private String stageId;

    /**
     * 房间分组列表 (A 组、B 组...)
     */
    private List<GroupRowVO> groups;

    /**
     * 单个房间分组视图
     */
    @Data
    public static class GroupRowVO {
        private String groupId;
        private String groupName;
        private List<RoundCardVO> rounds; // R1 ~ Rn 各小局卡片
    }

    /**
     * 单小局对局房卡片视图
     */
    @Data
    public static class RoundCardVO {
        private String matchRoundId;
        private Integer roundNumber;
        private String status; // PENDING, PLAYING, FINISHED
        private List<PlayerRankItemVO> rankings; // 8 位选手的名次与得分 (按 1~8 名排序)
    }

    /**
     * 单小局内单个选手的落位成绩
     */
    @Data
    public static class PlayerRankItemVO {
        private Integer rank;
        private String playerId;
        private String name;
        private String gameId;
        private String avatarUrl;
        private Integer score;
        private Boolean isMatchPoint;
    }
}
