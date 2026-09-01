package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 赛事主表持久化实体 (tournaments)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("tournaments")
public class Tournament implements Serializable {

    /**
     * 赛事唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属主办方/创建者租户 ID
     */
    private String tenantId;

    /**
     * 赛事标题 (如: 2026 第一届云顶之弈月亮杯)
     */
    private String title;

    /**
     * 参赛总人数规模 (8 / 16 / 32 / 64 / 128)
     */
    private Integer totalPlayers;

    /**
     * 8 位全网唯一公开观赛分享码 (如: WW4U9JCU)
     */
    private String shareCode;

    /**
     * 赛事状态: DRAFT(草稿) / IN_PROGRESS(进行中) / COMPLETED(完赛) / ARCHIVED(归档)
     */
    private String status;

    /**
     * 当前正在进行的赛段 ID
     */
    private String currentStageId;

    /**
     * 逻辑删除标识: 0-正常, 1-已删除
     */
    private Integer isDeleted;

    /**
     * 赛事创建时间
     */
    private Date createdAt;

    /**
     * 赛事最后更新时间
     */
    private Date updatedAt;

    /**
     * 创建者用户名称（非数据库持久化字段）
     */
    @TableField(exist = false)
    private String creatorName;
}
