package com.yunding.config;

import cn.dev33.satoken.stp.StpInterface;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Sa-Token 自定义权限与角色加载扩展实现
 * <p>
 * 从用户登录 Session 缓存中动态提取当前账号拥有的角色（SUPER_ADMIN / ORGANIZER），配合 @SaCheckRole 使用。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@Component
public class StpInterfaceImpl implements StpInterface {

    @Override
    public List<String> getPermissionList(Object loginId, String loginType) {
        return new ArrayList<>();
    }

    @Override
    public List<String> getRoleList(Object loginId, String loginType) {
        List<String> list = new ArrayList<>();
        // 从当前登录会话 Session 中提取角色标识
        String role = (String) StpUtil.getSession().get("role");
        if (role != null) {
            list.add(role);
        }
        return list;
    }
}
