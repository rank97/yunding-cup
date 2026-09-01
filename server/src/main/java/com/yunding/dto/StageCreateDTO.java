package com.yunding.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 赛段创建与配置参数 DTO
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class StageCreateDTO {

    /**
     * 赛段名称 (例: 初赛 (32进24)、半决赛、巅峰总决赛)
     */
    @NotBlank(message = "阶段名称不能为空")
    private String name;

    /**
     * 赛制类型: STANDARD(标准局数制) / CHECKPOINT_FINAL(20分赛点登顶制)
     */
    private String stageType = "STANDARD";

    /**
     * 预设比赛小局数 (如: 3 局制 / 5 局制)
     */
    @Min(value = 1, message = "比赛局数至少为 1 局")
    private Integer roundCount = 3;

    /**
     * 直通总决赛保送名额数量
     */
    @Min(value = 0, message = "直通名额不能为负数")
    private Integer directToFinalCount = 0;

    /**
     * 赛段淘汰名额数量
     */
    @Min(value = 0, message = "淘汰人数不能为负数")
    private Integer eliminateCount = 0;

    /**
     * 是否继承上一赛段底分: 1-继承, 0-清零重计
     */
    private Integer inheritScores = 0;

    /**
     * 积分规则模板 ID (默认 1 为 8-7-6-5-4-3-2-1，2 为 9-7-6-5-4-3-2-1)
     */
    private String scoreRuleId = "1";
}
