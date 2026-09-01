package com.yunding.common;

import lombok.Getter;

/**
 * 自定义业务异常类
 * <p>
 * 用于在业务逻辑校验失败、权限非法或非法流转操作时显式抛出中断。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@Getter
public class BizException extends RuntimeException {

    /**
     * 错误状态码 (默认 500)
     */
    private final Integer code;

    public BizException(String message) {
        super(message);
        this.code = 500;
    }

    public BizException(Integer code, String message) {
        super(message);
        this.code = code;
    }
}
