package com.yunding.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Server-Sent Events (SSE) 长连接广播调度管理器
 * <p>
 * 按照赛事 8 位观赛码 (shareCode) 维护观赛端长连接通道池，
 * 提供自动 15 秒心跳保活、连接生命周期管理与实时电竞比分/赛段流转事件广播推送。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@Slf4j
@Component
public class SseEmitterManager {

    /**
     * 线程安全的多赛事 SSE 连接通道池映射
     * Key: 8 位观赛分享码 (shareCode)
     * Value: 当前正在观看该赛事的全部客户端 SseEmitter 列表
     */
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitterMap = new ConcurrentHashMap<>();

    /**
     * 为指定的观赛码创建并注册一个新的 SSE 连接
     *
     * @param shareCode 8 位观赛分享码
     * @return SseEmitter 实例（默认 10 分钟超时，带定时心跳保活）
     */
    public SseEmitter createEmitter(String shareCode) {
        // 10 分钟超时保活
        SseEmitter emitter = new SseEmitter(10 * 60 * 1000L);
        emitterMap.computeIfAbsent(shareCode, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(shareCode, emitter));
        emitter.onTimeout(() -> removeEmitter(shareCode, emitter));
        emitter.onError(e -> removeEmitter(shareCode, emitter));

        try {
            // 发送初次建立连接确认事件
            emitter.send(SseEmitter.event().name("CONNECT").data("connected"));
        } catch (IOException e) {
            removeEmitter(shareCode, emitter);
        }

        return emitter;
    }

    /**
     * 定时发送心跳保持长连接通道存活 (每 15 秒触发一次)
     */
    @Scheduled(fixedRate = 15000)
    public void sendHeartbeat() {
        if (emitterMap.isEmpty()) return;
        for (Map.Entry<String, CopyOnWriteArrayList<SseEmitter>> entry : emitterMap.entrySet()) {
            String shareCode = entry.getKey();
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().name("HEARTBEAT").data("ping"));
                } catch (Throwable e) {
                    removeEmitter(shareCode, emitter);
                }
            }
        }
    }

    /**
     * 向指定赛事房间的所有观赛客户端广播实时业务事件
     *
     * @param shareCode 8 位观赛分享码
     * @param eventName 事件名称 (如: SCORE_UPDATED, STAGE_GROUPED, STAGE_LOCKED)
     * @param data      事件携带的数据载荷
     */
    public void broadcast(String shareCode, String eventName, Object data) {
        CopyOnWriteArrayList<SseEmitter> emitters = emitterMap.get(shareCode);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (Throwable e) {
                removeEmitter(shareCode, emitter);
            }
        }
    }

    /**
     * 移除失效或关闭的 SSE 连接
     */
    private void removeEmitter(String shareCode, SseEmitter emitter) {
        try {
            emitter.complete();
        } catch (Throwable ignored) {
        }
        CopyOnWriteArrayList<SseEmitter> list = emitterMap.get(shareCode);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitterMap.remove(shareCode);
            }
        }
    }
}
