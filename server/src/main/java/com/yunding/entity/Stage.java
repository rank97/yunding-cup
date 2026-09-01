package com.yunding.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 赛段流转配置主表实体 (stages)
 *
 * @author TFT-TourneyOS Team
 */
@Data
@TableName("stages")
public class Stage implements Serializable {

    /**
     * 赛段唯一 UUID 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属赛事 ID
     */
    private String tournamentId;

    /**
     * 赛段名称 (例: 初赛 (32进24)、半决赛、巅峰总决赛)
     */
    private String name;

    /**
     * 赛段序号 (1, 2, 3...)
     */
    private Integer stageOrder;

    /**
     * 赛制类型: STANDARD(标准局数积分制) / CHECKPOINT_FINAL(20分赛点登顶制)
     */
    private String stageType;

    /**
     * 预设比赛小局数 (如: 3 局制 / 5 局制)
     */
    private Integer roundCount;

    /**
     * 直通总决赛保送名额数量 (0 为无直通通道)
     */
    private Integer directToFinalCount;

    /**
     * 赛段末位淘汰名额数量
     */
    private Integer eliminateCount;

    /**
     * 是否继承前序赛段底分: 1-继承, 0-清零重计
     */
    private Integer inheritScores;

    /**
     * 赛点制最大对局熔断上限局数 (防止无限死循环)
     */
    private Integer maxRoundLimit;

    /**
     * 本赛段绑定的积分规则模板 ID
     */
    private String scoreRuleId;

    /**
     * 赛段状态: PENDING(待分桌) / GROUPED(已分桌) / IN_PROGRESS(进行中) / COMPLETED(已完赛) / LOCKED(已锁定)
     */
    private String status;

    /**
     * 逻辑删除标识: 0-正常, 1-已删除
     */
    private Integer isDeleted;

    /**
     * 赛段创建时间
     */
    private Date createdAt;

    /**
     * 赛段更新时间
     */
    private Date updatedAt;
}
