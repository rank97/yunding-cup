package com.yunding.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class SseEmitterManager {

    // key: shareCode, value: list of emitters
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitterMap = new ConcurrentHashMap<>();

    public SseEmitter createEmitter(String shareCode) {
        // 10分钟超时
        SseEmitter emitter = new SseEmitter(10 * 60 * 1000L);
        emitterMap.computeIfAbsent(shareCode, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(shareCode, emitter));
        emitter.onTimeout(() -> removeEmitter(shareCode, emitter));
        emitter.onError(e -> removeEmitter(shareCode, emitter));

        try {
            emitter.send(SseEmitter.event().name("CONNECT").data("connected"));
        } catch (IOException e) {
            removeEmitter(shareCode, emitter);
        }

        return emitter;
    }

    @Scheduled(fixedRate = 15000)
    public void sendHeartbeat() {
        if (emitterMap.isEmpty()) return;
        for (Map.Entry<String, CopyOnWriteArrayList<SseEmitter>> entry : emitterMap.entrySet()) {
            String shareCode = entry.getKey();
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().name("HEARTBEAT").data("ping"));
                } catch (Exception e) {
                    removeEmitter(shareCode, emitter);
                }
            }
        }
    }

    public void broadcast(String shareCode, String eventName, Object data) {
        CopyOnWriteArrayList<SseEmitter> emitters = emitterMap.get(shareCode);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (Exception e) {
                removeEmitter(shareCode, emitter);
            }
        }
    }

    private void removeEmitter(String shareCode, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = emitterMap.get(shareCode);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitterMap.remove(shareCode);
            }
        }
    }
}
