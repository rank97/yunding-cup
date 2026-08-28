package com.yunding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GroupingReqDTO {
    @NotBlank(message = "分组模式不能为空 (SNAKE / RANDOM)")
    private String mode; // SNAKE, RANDOM
}
