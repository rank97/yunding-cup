package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 赛段房间分组实体 (stage_groups)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("stage_groups")
public class StageGroup implements Serializable {

    /**
     * 分组唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属赛段 ID
     */
    private String stageId;

    /**
     * 组别名称 (例: A 组, B 组, 决赛组)
     */
    private String groupName;

    /**
     * 组别排列序号 (1, 2, 3...)
     */
    private Integer groupOrder;

    /**
     * 创建时间
     */
    private Date createdAt;
}
