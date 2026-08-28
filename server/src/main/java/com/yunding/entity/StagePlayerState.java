package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;

@Data
@TableName("stage_player_states")
public class StagePlayerState implements Serializable {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String stageId;
    private String playerId;
    private Integer carryOverScore;
    private Integer stageScore;
    private Integer totalScore;
    private Integer firstPlaceCount;
    private Integer top4Count;
    private Integer finalRank;
    private String advancementStatus; // NONE, ADVANCED, DIRECT_FINAL, ELIMINATED, CHAMPION
    private Integer isMatchPoint; // 0: false, 1: true
}
