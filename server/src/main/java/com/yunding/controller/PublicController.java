package com.yunding.controller;

import com.yunding.common.Result;
import com.yunding.entity.ScoreRule;
import com.yunding.entity.Tournament;
import com.yunding.service.PublicService;
import com.yunding.vo.GroupDetailsVO;
import com.yunding.vo.StageLeaderboardVO;
import com.yunding.vo.TournamentOverviewVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

/**
 * 公开观赛与大屏实时推流控制器
 * <p>
 * 无需登录鉴权，供全网观众、电竞转播大屏及移动端观众通过 8 位赛事观赛码（ShareCode）
 * 查询赛事全景赛程流水树、实时积分榜单、房间对局详情、积分规则模板列表，并通过 SSE 长连接接收实时比分推送。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

    private final PublicService publicService;

    /**
     * 获取所有公开进行的赛事列表（用于观赛码大厅与首页推荐卡片）
     *
     * @return 公开赛事列表
     */
    @GetMapping("/tournaments")
    public Result<List<Tournament>> listTournaments() {
        return Result.success(publicService.listPublicTournaments());
    }

    /**
     * 查询系统中所有可用的积分规则模板列表（供前端赛段编排下拉选择）
     *
     * @return 积分规则模板列表
     */
    @GetMapping("/score-rules")
    public Result<List<ScoreRule>> listScoreRules() {
        return Result.success(publicService.listScoreRules());
    }

    /**
     * 依据 8 位观赛码获取赛事全景赛程流水大屏导图（含全赛段流转树、选手卡片与冠军王座）
     *
     * @param shareCode 8 位观赛分享码 (如: WW4U9JCU)
     * @return 赛事全景概览 VO
     */
    @GetMapping("/tournaments/{shareCode}/overview")
    public Result<TournamentOverviewVO> getTournamentOverview(@PathVariable String shareCode) {
        return Result.success(publicService.getTournamentOverview(shareCode));
    }

    /**
     * 获取指定赛段的阶段积分排行榜（含每小局得分分布、吃鸡/前四统计与同分决胜排名）
     *
     * @param shareCode 8 位观赛分享码
     * @param stageId   赛段 ID
     * @return 阶段积分榜 VO
     */
    @GetMapping("/tournaments/{shareCode}/stages/{stageId}/leaderboard")
    public Result<StageLeaderboardVO> getStageLeaderboard(@PathVariable String shareCode, @PathVariable String stageId) {
        return Result.success(publicService.getStageLeaderboard(shareCode, stageId));
    }

    /**
     * 获取指定赛段各房间分组的逐局对战明细卡片（支持 R1~Rn 每局名次与得分）
     *
     * @param shareCode 8 位观赛分享码
     * @param stageId   赛段 ID
     * @return 房间对战详情 VO
     */
    @GetMapping("/tournaments/{shareCode}/stages/{stageId}/group-details")
    public Result<GroupDetailsVO> getGroupDetails(@PathVariable String shareCode, @PathVariable String stageId) {
        return Result.success(publicService.getGroupDetails(shareCode, stageId));
    }

    /**
     * 订阅赛事专属的 Server-Sent Events (SSE) 实时推流
     * <p>
     * 裁判录入比分、赛段分组、赛段锁定完赛时，服务端将毫秒级向所有连接的观赛客户端广播更新事件。
     * </p>
     *
     * @param shareCode 8 位观赛分享码
     * @return SSE Emitter 响应流
     */
    @GetMapping(value = "/tournaments/{shareCode}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String shareCode) {
        return publicService.createSseEmitter(shareCode);
    }
}
