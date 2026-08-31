package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
@TableName("tournaments")
public class Tournament implements Serializable {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String tenantId;
    private String title;
    private Integer totalPlayers;
    private String shareCode;
    private String status; // DRAFT, IN_PROGRESS, COMPLETED, ARCHIVED
    private String currentStageId;
    private Integer isDeleted;
    private Date createdAt;
    private Date updatedAt;

    @TableField(exist = false)
    private String creatorName;
}
