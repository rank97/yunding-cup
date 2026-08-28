package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
@TableName("players")
public class Player implements Serializable {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String tournamentId;
    private String name;
    private String gameId;
    private String avatarUrl;
    private Integer initialSeed;
    private Date createdAt;
}
