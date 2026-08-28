package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
@TableName("stages")
public class Stage implements Serializable {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String tournamentId;
    private String name;
    private Integer stageOrder;
    private String stageType; // STANDARD, CHECKPOINT_FINAL
    private Integer roundCount;
    private Integer directToFinalCount;
    private Integer eliminateCount;
    private Integer inheritScores; // 0: false, 1: true
    private Integer maxRoundLimit;
    private String scoreRuleId;
    private String status; // PENDING, GROUPED, IN_PROGRESS, COMPLETED, LOCKED
    private Integer isDeleted;
    private Date createdAt;
    private Date updatedAt;
}
