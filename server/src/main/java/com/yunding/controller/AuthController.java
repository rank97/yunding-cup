package com.yunding.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.yunding.common.Result;
import com.yunding.dto.LoginDTO;
import com.yunding.dto.PasswordUpdateDTO;
import com.yunding.dto.RegisterDTO;
import com.yunding.entity.User;
import com.yunding.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户认证与权限管理控制器
 * <p>
 * 提供用户登录、主办方自主注册、当前登录用户信息获取、登录密码修改及注销退出等接口。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 用户账号登录
     *
     * @param dto 登录参数（用户名、密码）
     * @return 包含 Sa-Token 令牌与用户实体的响应 Map
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody @Valid LoginDTO dto) {
        return Result.success(authService.login(dto));
    }

    /**
     * 赛事主办方账号注册
     * <p>
     * 开放注册角色为普通主办方（ORGANIZER），注册成功后自动分配默认 8-7-6-5-4-3-2-1 积分规则。
     * </p>
     *
     * @param dto 注册参数（用户名、密码）
     * @return 注册成功的用户信息
     */
    @PostMapping("/register")
    public Result<User> register(@RequestBody @Valid RegisterDTO dto) {
        return Result.success(authService.register(dto));
    }

    /**
     * 获取当前登录用户详情
     *
     * @return 当前会话用户信息
     */
    @GetMapping("/info")
    public Result<User> getInfo() {
        return Result.success(authService.getCurrentUser());
    }

    /**
     * 修改当前登录用户的登录密码
     *
     * @param dto 旧密码与新密码参数
     * @return 操作成功结果
     */
    @PutMapping("/password")
    public Result<?> updatePassword(@RequestBody @Valid PasswordUpdateDTO dto) {
        authService.updatePassword(dto);
        return Result.success();
    }

    /**
     * 用户注销退出登录
     *
     * @return 操作成功结果
     */
    @PostMapping("/logout")
    public Result<?> logout() {
        StpUtil.logout();
        return Result.success();
    }
}
