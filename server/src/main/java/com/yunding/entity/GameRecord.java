package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
@TableName("game_records")
public class GameRecord implements Serializable {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String matchRoundId;
    private String playerId;
    private Integer rank; // 1~8
    private Integer score; // 根据规则计算的得分
    private Date createdAt;
    private Date updatedAt;
}
