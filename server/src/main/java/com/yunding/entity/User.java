package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 用户认证与权限实体 (users)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("users")
public class User implements Serializable {

    /**
     * 用户唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 登录用户名
     */
    private String username;

    /**
     * BCrypt 加密后的密码哈希值
     */
    private String passwordHash;

    /**
     * 角色标识: SUPER_ADMIN(超级管理员) / ORGANIZER(主办方/裁判)
     */
    private String role;

    /**
     * 注册创建时间
     */
    private Date createdAt;

    /**
     * 最后更新时间
     */
    private Date updatedAt;
}
