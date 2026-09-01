package com.yunding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 赛段分池分组算法请求参数 DTO
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class GroupingReqDTO {

    /**
     * 分池模式:
     * - SNAKE: S型蛇形分桌算法（基于前序积分/种子顺位）
     * - RANDOM: 随机打散等分
     */
    @NotBlank(message = "分池模式不能为空")
    private String mode; // SNAKE or RANDOM
}
