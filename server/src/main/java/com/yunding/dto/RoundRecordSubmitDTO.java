package com.yunding.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class RoundRecordSubmitDTO {
    @NotEmpty(message = "对局成绩不能为空")
    private List<PlayerRecordItem> records;

    @Data
    public static class PlayerRecordItem {
        private String playerId;
        private Integer rank; // 1~8
    }
}
