package com.yunding.service.impl;

import cn.dev33.satoken.secure.BCrypt;
import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yunding.common.BizException;
import com.yunding.common.Constants;
import com.yunding.dto.LoginDTO;
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

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final ScoreRuleMapper scoreRuleMapper;

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

        StpUtil.login(user.getId());
        StpUtil.getSession().set("role", user.getRole());
        StpUtil.getSession().set("username", user.getUsername());

        Map<String, Object> map = new HashMap<>();
        map.put("token", StpUtil.getTokenValue());
        map.put("user", user);
        return map;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User register(RegisterDTO dto) {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, dto.getUsername()));
        if (count > 0) {
            throw new BizException("用户名已存在");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPasswordHash(BCrypt.hashpw(dto.getPassword()));
        user.setRole(dto.getRole() != null ? dto.getRole() : Constants.ROLE_ORGANIZER);
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        userMapper.insert(user);

        // 创建系统默认积分规则给该用户
        ScoreRule defaultRule = new ScoreRule();
        defaultRule.setTenantId(user.getId());
        defaultRule.setRuleName("系统标准积分规则 (8-1分)");
        defaultRule.setIsSystemDefault(1);
        defaultRule.setScoreMapping(Constants.DEFAULT_SCORE_MAPPING);
        defaultRule.setCreatedAt(new Date());
        scoreRuleMapper.insert(defaultRule);

        return user;
    }

    @Override
    public User getCurrentUser() {
        String userId = (String) StpUtil.getLoginId();
        return userMapper.selectById(userId);
    }
}
