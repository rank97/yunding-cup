package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 分组房间选手席位排布实体 (stage_group_players)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("stage_group_players")
public class StageGroupPlayer implements Serializable {

    /**
     * 席位记录唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属房间分组 ID
     */
    private String stageGroupId;

    /**
     * 入座选手 ID
     */
    private String playerId;

    /**
     * 蛇形分池种子序号 (1~N)
     */
    private Integer seedIndex;
}
