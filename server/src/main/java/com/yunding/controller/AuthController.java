package com.yunding.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.yunding.common.Result;
import com.yunding.dto.LoginDTO;
import com.yunding.dto.RegisterDTO;
import com.yunding.entity.User;
import com.yunding.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody @Valid LoginDTO dto) {
        return Result.success(authService.login(dto));
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody @Valid RegisterDTO dto) {
        return Result.success(authService.register(dto));
    }

    @GetMapping("/info")
    public Result<User> getInfo() {
        return Result.success(authService.getCurrentUser());
    }

    @PostMapping("/logout")
    public Result<?> logout() {
        StpUtil.logout();
        return Result.success();
    }
}
