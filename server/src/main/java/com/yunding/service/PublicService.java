package com.yunding.service;

import com.yunding.entity.ScoreRule;
import com.yunding.entity.Tournament;
import com.yunding.vo.GroupDetailsVO;
import com.yunding.vo.StageLeaderboardVO;
import com.yunding.vo.TournamentOverviewVO;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

/**
 * 公开观赛与大屏实时推流业务接口
 *
 * @author TFT-TourneyOS Team
 */
public interface PublicService {

    /**
     * 查询全网公开展示的赛事列表（按创建时间倒序）
     *
     * @return 公开赛事列表
     */
    List<Tournament> listPublicTournaments();

    /**
     * 查询系统中所有可用的积分规则模板列表
     *
     * @return 积分规则列表
     */
    List<ScoreRule> listScoreRules();

    /**
     * 依据 8 位观赛码获取赛事全景流水大屏导图（含全阶段流转卡片与冠军王座）
     *
     * @param shareCode 8 位观赛分享码
     * @return 赛事全景概览 VO
     */
    TournamentOverviewVO getTournamentOverview(String shareCode);

    /**
     * 获取指定赛段的阶段积分排行榜（含小局得分明细、同分决胜与晋级标记）
     *
     * @param shareCode 8 位观赛分享码
     * @param stageId   赛段 ID
     * @return 阶段积分榜 VO
     */
    StageLeaderboardVO getStageLeaderboard(String shareCode, String stageId);

    /**
     * 获取指定赛段各房间分组的逐局对战明细卡片
     *
     * @param shareCode 8 位观赛分享码
     * @param stageId   赛段 ID
     * @return 房间对战详情 VO
     */
    GroupDetailsVO getGroupDetails(String shareCode, String stageId);

    /**
     * 订阅赛事专属的 Server-Sent Events (SSE) 实时长连接
     *
     * @param shareCode 8 位观赛分享码
     * @return SseEmitter 实例
     */
    SseEmitter createSseEmitter(String shareCode);

    /**
     * 获取指定赛事的公开报名概况与选手名册信息
     *
     * @param shareCode 8 位观赛分享码
     * @return 报名概况详情 Map
     */
    Map<String, Object> getSignupInfo(String shareCode);

    /**
     * 选手自主在线公开报名参赛
     *
     * @param shareCode 8 位观赛分享码
     * @param name      选手姓名 / 参赛称呼
     * @param gameId    游戏内 ID
     * @param avatarUrl 选手头像 URL
     * @return 报名成功的选手实体
     */
    com.yunding.entity.Player publicSignup(String shareCode, String name, String gameId, String avatarUrl);
}
