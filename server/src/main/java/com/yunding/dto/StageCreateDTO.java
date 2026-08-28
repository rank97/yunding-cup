package com.yunding.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StageCreateDTO {
    @NotBlank(message = "赛段名称不能为空")
    private String name;
    private Integer stageOrder;
    private String stageType; // STANDARD, CHECKPOINT_FINAL
    @Min(value = 1, message = "局数必须大于等于1")
    private Integer roundCount;
    private Integer directToFinalCount;
    private Integer eliminateCount;
    private Integer inheritScores; // 0: false, 1: true
    private Integer maxRoundLimit;
    private String scoreRuleId;
}
