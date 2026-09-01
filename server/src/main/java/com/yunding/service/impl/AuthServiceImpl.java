package com.yunding.service.impl;

import cn.dev33.satoken.secure.BCrypt;
import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yunding.common.BizException;
import com.yunding.common.Constants;
import com.yunding.dto.LoginDTO;
import com.yunding.dto.PasswordUpdateDTO;
import com.yunding.dto.RegisterDTO;
import com.yunding.entity.ScoreRule;
import com.yunding.entity.User;
import com.yunding.mapper.ScoreRuleMapper;
import com.yunding.mapper.UserMapper;
import com.yunding.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 用户认证与账号管理业务实现类
 *
 * @author TFT-TourneyOS Team
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final ScoreRuleMapper scoreRuleMapper;

    /**
     * 用户账号登录认证
     */
    @Override
    public Map<String, Object> login(LoginDTO dto) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, dto.getUsername()));
        if (user == null) {
            throw new BizException("用户不存在");
        }

        if (!BCrypt.checkpw(dto.getPassword(), user.getPasswordHash())) {
            throw new BizException("密码错误");
        }

        // Sa-Token 会话登录并持久化角色与用户名
        StpUtil.login(user.getId());
        StpUtil.getSession().set("role", user.getRole());
        StpUtil.getSession().set("username", user.getUsername());

        Map<String, Object> map = new HashMap<>();
        map.put("token", StpUtil.getTokenValue());
        map.put("user", user);
        return map;
    }

    /**
     * 主办方自主注册
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public User register(RegisterDTO dto) {
        String username = dto.getUsername() != null ? dto.getUsername().trim() : "";
        if ("admin".equalsIgnoreCase(username)) {
            throw new BizException("无法使用系统保留的超管账号名称");
        }

        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));
        if (count > 0) {
            throw new BizException("用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(BCrypt.hashpw(dto.getPassword()));
        // 注册用户严格限定为普通主办方角色，超级管理员仅限系统唯一内置 admin 账号
        user.setRole(Constants.ROLE_ORGANIZER);
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        userMapper.insert(user);

        // 为新注册主办方初始化分配一套系统标准默认积分规则 (8-7-6-5-4-3-2-1)
        ScoreRule defaultRule = new ScoreRule();
        defaultRule.setTenantId(user.getId());
        defaultRule.setRuleName("系统标准积分规则 (8-1分)");
        defaultRule.setIsSystemDefault(1);
        defaultRule.setScoreMapping(Constants.DEFAULT_SCORE_MAPPING);
        defaultRule.setCreatedAt(new Date());
        scoreRuleMapper.insert(defaultRule);

        return user;
    }

    /**
     * 获取当前登录会话的用户信息
     */
    @Override
    public User getCurrentUser() {
        String userId = (String) StpUtil.getLoginId();
        return userMapper.selectById(userId);
    }

    /**
     * 修改当前登录账号的密码
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePassword(PasswordUpdateDTO dto) {
        String userId = (String) StpUtil.getLoginId();
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BizException("用户不存在");
        }

        if (!BCrypt.checkpw(dto.getOldPassword(), user.getPasswordHash())) {
            throw new BizException("旧密码输入错误，修改失败");
        }

        if (dto.getNewPassword().equals(dto.getOldPassword())) {
            throw new BizException("新密码不能与旧密码相同");
        }

        user.setPasswordHash(BCrypt.hashpw(dto.getNewPassword()));
        user.setUpdatedAt(new Date());
        userMapper.updateById(user);
    }
}
