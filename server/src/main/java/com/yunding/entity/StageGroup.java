package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
@TableName("stage_groups")
public class StageGroup implements Serializable {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String stageId;
    private String groupName;
    private Integer groupOrder;
    private Date createdAt;
}
