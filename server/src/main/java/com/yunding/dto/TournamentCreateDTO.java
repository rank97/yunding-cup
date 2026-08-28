package com.yunding.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class TournamentCreateDTO {
    @NotBlank(message = "赛事名称不能为空")
    private String title;

    @Min(value = 8, message = "参赛总人数必须大于等于8且为8的倍数")
    private Integer totalPlayers;

    @NotEmpty(message = "赛段配置不能为空")
    private List<StageCreateDTO> stages;
}
