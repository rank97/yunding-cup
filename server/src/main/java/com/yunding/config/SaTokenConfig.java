package com.yunding.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.router.SaRouter;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sa-Token 权限拦截与跨域（CORS）配置中心
 * <p>
 * 配置公开放行路由（登录、注册、大屏公开观赛接口）与全局登录鉴权拦截，并配置跨域资源共享规则。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@Configuration
public class SaTokenConfig implements WebMvcConfigurer {

    /**
     * 注册 Sa-Token 路由拦截器
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SaInterceptor(handler -> {
            // 1. 公开接口免登录放行
            SaRouter.match("/api/v1/auth/login", r -> SaRouter.stop());
            SaRouter.match("/api/v1/auth/register", r -> SaRouter.stop());
            SaRouter.match("/api/v1/public/**", r -> SaRouter.stop());
            SaRouter.match("/error", r -> SaRouter.stop());

            // 2. 其它所有中台赛事管理、赛段排布与密码修改等核心接口均需登录校验
            SaRouter.match("/api/v1/**", r -> StpUtil.checkLogin());
        })).addPathPatterns("/**");
    }

    /**
     * 配置跨域过滤器 (CORS)
     */
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
