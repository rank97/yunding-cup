package com.yunding.common;

import lombok.Data;

import java.io.Serializable;

/**
 * 全局统一 RESTful API 响应数据包装类
 *
 * @param <T> 响应业务数据类型
 * @author TFT-TourneyOS Team
 */
@Data
public class Result<T> implements Serializable {

    /**
     * 业务状态码 (200: 成功, 400: 参数校验失败, 401: 未登录, 403: 权限不足, 500: 业务/系统异常)
     */
    private Integer code;

    /**
     * 响应提示信息
     */
    private String message;

    /**
     * 响应具体负载数据
     */
    private T data;

    /**
     * 响应时间戳 (毫秒)
     */
    private Long timestamp;

    public Result() {
        this.timestamp = System.currentTimeMillis();
    }

    /**
     * 成功响应（携带数据）
     *
     * @param data 响应数据
     * @param <T>  数据泛型
     * @return Result 统一对象
     */
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }

    /**
     * 成功响应（无返回数据）
     *
     * @param <T> 数据泛型
     * @return Result 统一对象
     */
    public static <T> Result<T> success() {
        return success(null);
    }

    /**
     * 错误失败响应
     *
     * @param code    错误状态码
     * @param message 错误描述
     * @param <T>     数据泛型
     * @return Result 统一对象
     */
    public static <T> Result<T> error(Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }

    /**
     * 默认 500 业务错误响应
     *
     * @param message 错误描述
     * @param <T>     数据泛型
     * @return Result 统一对象
     */
    public static <T> Result<T> error(String message) {
        return error(500, message);
    }
}
