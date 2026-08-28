package com.yunding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class TournamentUpdateDTO {
    @NotBlank(message = "赛事名称不能为空")
    private String title;

    private List<StageUpdateItemDTO> stages;

    @Data
    public static class StageUpdateItemDTO {
        private String id;
        private String name;
        private Integer roundCount;
        private Integer directToFinalCount;
        private Integer eliminateCount;
        private Integer inheritScores;
        private String stageType;
        private Integer maxRoundLimit;
        private String scoreRuleId;
    }
}
