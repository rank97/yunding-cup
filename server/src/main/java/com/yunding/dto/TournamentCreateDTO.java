package com.yunding.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 赛事创建请求参数 DTO
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class TournamentCreateDTO {

    /**
     * 赛事标题 (如: 2026 第一届云顶之弈月亮杯)
     */
    @NotBlank(message = "赛事名称不能为空")
    private String title;

    /**
     * 参赛总人数规模 (必须为 8 的倍数，如 8/16/32/64/128)
     */
    @NotNull(message = "参赛总人数不能为空")
    @Min(value = 8, message = "参赛总人数必须至少为 8 人")
    private Integer totalPlayers;

    /**
     * 赛段流水配置列表
     */
    @NotEmpty(message = "必须配置至少一个赛段")
    @Valid
    private List<StageCreateDTO> stages;
}
