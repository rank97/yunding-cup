package com.yunding.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 单小局成绩录入与提交 DTO
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class RoundRecordSubmitDTO {

    /**
     * 8 位选手的单局名次成绩列表
     */
    @NotEmpty(message = "对局记录不能为空")
    @Valid
    private List<PlayerRecordItem> records;

    /**
     * 单个选手的名次记录条目
     */
    @Data
    public static class PlayerRecordItem {

        /**
         * 选手 ID
         */
        @NotBlank(message = "选手ID不能为空")
        private String playerId;

        /**
         * 落位名次 (1 ~ 8)
         */
        @NotNull(message = "名次不能为空")
        @Min(value = 1, message = "名次最小为 1")
        @Max(value = 8, message = "名次最大为 8")
        private Integer rank;
    }
}
