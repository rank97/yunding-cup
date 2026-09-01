package com.yunding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 登录密码修改请求参数 DTO
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class PasswordUpdateDTO {

    /**
     * 旧密码
     */
    @NotBlank(message = "旧密码不能为空")
    private String oldPassword;

    /**
     * 新密码 (6~32 位)
     */
    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 32, message = "新密码长度至少 6 位")
    private String newPassword;
}
