package com.yunding.common;

import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotRoleException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局统一异常拦截与处理中心
 * <p>
 * 捕获业务异常、Sa-Token 鉴权异常、JSR-303 参数校验异常及未捕获的系统异常，并转化为规范统一的 Result 响应。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 业务自定义异常捕获
     */
    @ExceptionHandler(BizException.class)
    public Result<?> handleBizException(BizException e) {
        log.warn("业务异常拦截: code={}, message={}", e.getCode(), e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    /**
     * 未登录或 Token 过期失效异常捕获 (HTTP 401)
     */
    @ExceptionHandler(NotLoginException.class)
    public Result<?> handleNotLoginException(NotLoginException e) {
        log.warn("未登录或 Token 失效拦截: {}", e.getMessage());
        return Result.error(401, "请先登录或 Token 已过期");
    }

    /**
     * 权限角色不足异常捕获 (HTTP 403)
     */
    @ExceptionHandler(NotRoleException.class)
    public Result<?> handleNotRoleException(NotRoleException e) {
        log.warn("权限不足拦截: {}", e.getMessage());
        return Result.error(403, "无权限访问此接口");
    }

    /**
     * JSR-303 / Hibernate Validator 参数校验绑定异常捕获 (HTTP 400)
     */
    @ExceptionHandler(BindException.class)
    public Result<?> handleBindException(BindException e) {
        String msg = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        log.warn("参数绑定校验失败: {}", msg);
        return Result.error(400, msg);
    }

    /**
     * 未知兜底系统运行异常捕获 (HTTP 500)
     */
    @ExceptionHandler(Exception.class)
    public Result<?> handleException(Exception e) {
        log.error("系统运行未知异常:", e);
        return Result.error(500, "系统繁忙: " + e.getMessage());
    }
}
