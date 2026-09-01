package com.yunding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

/**
 * 赛事信息及赛段配置更新请求参数 DTO
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class TournamentUpdateDTO {

    /**
     * 赛事名称
     */
    @NotBlank(message = "赛事名称不能为空")
    private String title;

    /**
     * 待更新赛段列表
     */
    private List<StageUpdateItemDTO> stages;

    @Data
    public static class StageUpdateItemDTO {
        private String id;
        private String name;
        private Integer roundCount;
        private Integer directToFinalCount;
        private Integer eliminateCount;
        private Integer inheritScores;
        private String scoreRuleId;
        private String stageType;
    }
}
