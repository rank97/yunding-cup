package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
@TableName("users")
public class User implements Serializable {
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String username;
    private String passwordHash;
    private String role; // SUPER_ADMIN, ORGANIZER
    private Date createdAt;
    private Date updatedAt;
}
