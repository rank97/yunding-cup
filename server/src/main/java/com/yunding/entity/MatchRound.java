package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
@TableName("match_rounds")
public class MatchRound implements Serializable {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String stageGroupId;
    private Integer roundNumber;
    private String status; // PENDING, PLAYING, FINISHED
    private Date createdAt;
}
