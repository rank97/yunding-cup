package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 赛段内选手状态与累计积分实体 (stage_player_states)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("stage_player_states")
public class StagePlayerState implements Serializable {

    /**
     * 状态记录唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 赛段 ID
     */
    private String stageId;

    /**
     * 选手 ID
     */
    private String playerId;

    /**
     * 上一赛段继承的底分 (未开启继承时为 0)
     */
    private Integer carryOverScore;

    /**
     * 本赛段各小局获得的总积分
     */
    private Integer stageScore;

    /**
     * 最终累计总分 = carryOverScore + stageScore
     */
    private Integer totalScore;

    /**
     * 本赛段吃鸡（第 1 名）次数（第 1 顺位同分决胜依据）
     */
    private Integer firstPlaceCount;

    /**
     * 本赛段前四名进入次数（第 2 顺位同分决胜依据）
     */
    private Integer top4Count;

    /**
     * 完赛最终排名
     */
    private Integer finalRank;

    /**
     * 晋级流转状态: NONE(待定) / ADVANCED(晋级) / DIRECT_FINAL(直通决赛) / ELIMINATED(淘汰) / CHAMPION(总冠军)
     */
    private String advancementStatus;

    /**
     * 20 分赛点触发标记: 1-已激活赛点, 0-未激活
     */
    private Integer isMatchPoint;
}
