package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 赛事参赛选手花名册实体 (players)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("players")
public class Player implements Serializable {

    /**
     * 选手唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属赛事 ID
     */
    private String tournamentId;

    /**
     * 选手姓名 / 参赛称呼
     */
    private String name;

    /**
     * 游戏内 ID (如: 虎牙丶红莲#1234)
     */
    private String gameId;

    /**
     * 选手头像 URL (可选)
     */
    private String avatarUrl;

    /**
     * 初始种子顺位 (1~N)
     */
    private Integer initialSeed;

    /**
     * 登记创建时间
     */
    private Date createdAt;
}
