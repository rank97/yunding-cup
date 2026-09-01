package com.yunding.service;

import com.yunding.dto.LoginDTO;
import com.yunding.dto.PasswordUpdateDTO;
import com.yunding.dto.RegisterDTO;
import com.yunding.entity.User;

import java.util.Map;

/**
 * 用户认证与账号管理业务接口
 *
 * @author TFT-TourneyOS Team
 */
public interface AuthService {

    /**
     * 用户账号登录认证
     *
     * @param dto 登录参数 (username, password)
     * @return 包含 Token 及用户实体的 Map
     */
    Map<String, Object> login(LoginDTO dto);

    /**
     * 主办方自主注册
     *
     * @param dto 注册参数 (username, password)
     * @return 注册成功的 User 实体
     */
    User register(RegisterDTO dto);

    /**
     * 获取当前登录会话的用户信息
     *
     * @return 当前 User 实体
     */
    User getCurrentUser();

    /**
     * 修改当前登录账号的密码
     *
     * @param dto 包含旧密码与新密码的参数 DTO
     */
    void updatePassword(PasswordUpdateDTO dto);
}
