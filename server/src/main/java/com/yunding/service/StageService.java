package com.yunding.service;

import com.yunding.dto.PlayerBatchImportDTO;
import com.yunding.entity.Player;

import java.util.List;
import java.util.Map;

/**
 * 赛段流转、选手名册与蛇形分组管理业务接口
 *
 * @author TFT-TourneyOS Team
 */
public interface StageService {

    /**
     * 批量导入参赛选手花名册（仅在草稿未开赛状态允许操作）
     *
     * @param dto 包含选手姓名与游戏 ID 的导入 DTO
     */
    void importPlayers(PlayerBatchImportDTO dto);

    /**
     * 查询指定赛事的全部参赛选手花名册
     *
     * @param tournamentId 赛事 ID
     * @return 选手列表
     */
    List<Player> listPlayers(String tournamentId);

    /**
     * 修改单个选手的姓名、游戏内 ID 或头像
     *
     * @param playerId  选手 ID
     * @param name      选手姓名
     * @param gameId    游戏内 ID
     * @param avatarUrl 选手头像 URL
     * @return 更新后的 Player 实体
     */
    Player updatePlayer(String playerId, String name, String gameId, String avatarUrl);

    /**
     * 获取指定赛段的综合分桌与对局房间详情
     *
     * @param stageId 赛段 ID
     * @return 包含赛段配置、各房间 8 位选手与小局状态的 Map
     */
    Map<String, Object> getStageDetail(String stageId);

    /**
     * 执行分池分组算法（SNAKE: S型蛇形分池, RANDOM: 随机均分）
     *
     * @param stageId 赛段 ID
     * @param mode    分池模式 (SNAKE / RANDOM)
     */
    void executeGrouping(String stageId, String mode);

    /**
     * 手动微调两名选手的桌次座位（支持跨房间桌次调换）
     *
     * @param stageId   赛段 ID
     * @param player1Id 选手 1 ID
     * @param player2Id 选手 2 ID
     */
    void swapPlayers(String stageId, String player1Id, String player2Id);

    /**
     * 清空当前赛段的分组与未打小局房间
     *
     * @param stageId 赛段 ID
     */
    void clearGrouping(String stageId);

    /**
     * 锁定当前赛段并执行晋级/淘汰结算，同时将晋级选手自动流转推送至下一赛段/总决赛
     *
     * @param stageId 赛段 ID
     */
    void lockStage(String stageId);

    /**
     * 解锁赛段（允许裁判回退并修正录入错误的比分成绩）
     *
     * @param stageId 赛段 ID
     */
    void unlockStage(String stageId);

    /**
     * 裁判手动修改选手的晋级流转状态（支持直通、晋级、淘汰或取消）
     *
     * @param stageId  赛段 ID
     * @param playerId 选手 ID
     * @param status   晋级状态 (ADVANCED / DIRECT_FINAL / ELIMINATED / NONE)
     */
    void updatePlayerAdvancement(String stageId, String playerId, String status);

    /**
     * 依据当前赛段总分及同分决胜规则自动分配晋级、直通与淘汰名额
     *
     * @param stageId 赛段 ID
     */
    void autoAssignAdvancement(String stageId);
}
