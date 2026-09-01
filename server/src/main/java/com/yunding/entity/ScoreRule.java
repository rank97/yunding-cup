package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 积分规则模板实体 (score_rules)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("score_rules")
public class ScoreRule implements Serializable {

    /**
     * 规则唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属租户/主办方用户 ID (GLOBAL 为公共默认规则)
     */
    private String tenantId;

    /**
     * 规则名称 (例: 官方标准积分 8-7-6-5-4-3-2-1)
     */
    private String ruleName;

    /**
     * 是否系统默认规则: 1-是, 0-否
     */
    private Integer isSystemDefault;

    /**
     * 名次积分映射 JSON 字符串 (例: {"1":8,"2":7,...,"8":1})
     */
    private String scoreMapping;

    /**
     * 创建时间
     */
    private Date createdAt;
}
