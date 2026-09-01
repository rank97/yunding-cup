package com.yunding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 主办方注册请求参数 DTO
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class RegisterDTO {

    /**
     * 注册用户名 (2~32 位)
     */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 32, message = "用户名长度需在 2~32 位之间")
    private String username;

    /**
     * 登录密码 (6~32 位)
     */
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度至少 6 位")
    private String password;
}
