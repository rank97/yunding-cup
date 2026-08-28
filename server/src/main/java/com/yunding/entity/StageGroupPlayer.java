package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;

@Data
@TableName("stage_group_players")
public class StageGroupPlayer implements Serializable {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String stageGroupId;
    private String playerId;
    private Integer seedIndex; // 1~8
}
