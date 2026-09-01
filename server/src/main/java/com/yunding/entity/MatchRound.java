package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 房间小局对局表实体 (match_rounds)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("match_rounds")
public class MatchRound implements Serializable {

    /**
     * 小局唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属房间分组 ID
     */
    private String stageGroupId;

    /**
     * 第几小局 (1, 2, 3...)
     */
    private Integer roundNumber;

    /**
     * 对局状态: PENDING(待开赛) / PLAYING(进行中) / FINISHED(已完赛)
     */
    private String status;

    /**
     * 创建时间
     */
    private Date createdAt;
}
