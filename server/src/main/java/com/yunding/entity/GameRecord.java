package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 单小局 8 位选手落位成绩与得分明细实体 (game_records)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("game_records")
public class GameRecord implements Serializable {

    /**
     * 战绩记录唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属小局 ID
     */
    private String matchRoundId;

    /**
     * 选手 ID
     */
    private String playerId;

    /**
     * 本局落位实际名次 (1 ~ 8)
     */
    private Integer rank;

    /**
     * 该名次对应获得的积分 (如: 8, 7, 6...)
     */
    private Integer score;

    /**
     * 录入时间
     */
    private Date createdAt;

    /**
     * 更新时间
     */
    private Date updatedAt;
}
