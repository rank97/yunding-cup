package com.yunding.controller;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yunding.common.Result;
import com.yunding.dto.GroupingReqDTO;
import com.yunding.dto.PlayerBatchImportDTO;
import com.yunding.entity.Player;
import com.yunding.service.StageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 赛段流转、选手名册与蛇形分组管理控制器
 * <p>
 * 提供选手批量导入/花名册维护、赛段详情查询、S型蛇形/随机分桌算法触发、
 * 手动换组调座、清空分组、赛段锁定完赛与流转晋级、自动/手动指定晋级名单等功能。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class StageController {

    private final StageService stageService;

    /**
     * 批量导入参赛选手花名册
     *
     * @param tournamentId 赛事 ID
     * @param dto          批量选手列表参数
     * @return 操作成功结果
     */
    @PostMapping("/tournaments/{tournamentId}/players/batch")
    @SaCheckLogin
    public Result<?> importPlayers(@PathVariable String tournamentId, @RequestBody PlayerBatchImportDTO dto) {
        dto.setTournamentId(tournamentId);
        stageService.importPlayers(dto);
        return Result.success();
    }

    /**
     * 查询指定赛事的全部参赛选手列表
     *
     * @param tournamentId 赛事 ID
     * @return 选手列表
     */
    @GetMapping("/tournaments/{tournamentId}/players")
    @SaCheckLogin
    public Result<List<Player>> listPlayers(@PathVariable String tournamentId) {
        return Result.success(stageService.listPlayers(tournamentId));
    }

    /**
     * 修改单个选手的姓名、游戏内 ID 或头像
     *
     * @param playerId 选手 ID
     * @param body     修改字段 Map
     * @return 更新后的选手实体
     */
    @PutMapping("/players/{playerId}")
    @SaCheckLogin
    public Result<Player> updatePlayer(@PathVariable String playerId, @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String gameId = body.get("gameId");
        String avatarUrl = body.get("avatarUrl");
        return Result.success(stageService.updatePlayer(playerId, name, gameId, avatarUrl));
    }

    /**
     * 获取指定赛段的分组排布、小局房间与参赛选手详情
     *
     * @param stageId 赛段 ID
     * @return 赛段综合详情 Map
     */
    @GetMapping("/stages/{stageId}")
    @SaCheckLogin
    public Result<Map<String, Object>> getStageDetail(@PathVariable String stageId) {
        return Result.success(stageService.getStageDetail(stageId));
    }

    /**
     * 执行赛段分池分组算法（支持 SNAKE 蛇形分桌与 RANDOM 随机等分）
     *
     * @param stageId 赛段 ID
     * @param dto     分组请求参数
     * @return 操作成功结果
     */
    @PostMapping("/stages/{stageId}/grouping")
    @SaCheckLogin
    public Result<?> executeGrouping(@PathVariable String stageId, @RequestBody @Valid GroupingReqDTO dto) {
        stageService.executeGrouping(stageId, dto.getMode());
        return Result.success();
    }

    /**
     * 手动微调两名选手的桌次座位（支持跨房间桌次调换）
     *
     * @param stageId 赛段 ID
     * @param body    包含 player1Id 与 player2Id 的请求体
     * @return 操作成功结果
     */
    @PostMapping("/stages/{stageId}/swap-players")
    @SaCheckLogin
    public Result<?> swapPlayers(@PathVariable String stageId, @RequestBody Map<String, String> body) {
        String player1Id = body.get("player1Id");
        String player2Id = body.get("player2Id");
        stageService.swapPlayers(stageId, player1Id, player2Id);
        return Result.success();
    }

    /**
     * 清空当前赛段的分组与未完赛小局对局房
     *
     * @param stageId 赛段 ID
     * @return 操作成功结果
     */
    @PostMapping("/stages/{stageId}/clear-grouping")
    @SaCheckLogin
    public Result<?> clearGrouping(@PathVariable String stageId) {
        stageService.clearGrouping(stageId);
        return Result.success();
    }

    /**
     * 锁定当前赛段并执行晋级/淘汰结算，同时将晋级选手自动流转推送至下一赛段/总决赛
     *
     * @param stageId 赛段 ID
     * @return 操作成功结果
     */
    @PostMapping("/stages/{stageId}/lock")
    @SaCheckLogin
    public Result<?> lockStage(@PathVariable String stageId) {
        stageService.lockStage(stageId);
        return Result.success();
    }

    /**
     * 解锁赛段（允许裁判回退并修正录入错误的比分成绩）
     *
     * @param stageId 赛段 ID
     * @return 操作成功结果
     */
    @PostMapping("/stages/{stageId}/unlock")
    @SaCheckLogin
    public Result<?> unlockStage(@PathVariable String stageId) {
        stageService.unlockStage(stageId);
        return Result.success();
    }

    /**
     * 裁判手动修改选手的晋级流转状态（如因违规判罚需手动指定直通、晋级或淘汰）
     *
     * @param stageId  赛段 ID
     * @param playerId 选手 ID
     * @param body     包含 advancementStatus 的请求体
     * @return 操作成功结果
     */
    @PutMapping("/stages/{stageId}/players/{playerId}/advancement")
    @SaCheckLogin
    public Result<?> updatePlayerAdvancement(@PathVariable String stageId, @PathVariable String playerId, @RequestBody Map<String, String> body) {
        String status = body.get("advancementStatus");
        stageService.updatePlayerAdvancement(stageId, playerId, status);
        return Result.success();
    }

    /**
     * 按照本赛段排名规则自动分配预设的晋级、直通与淘汰名额
     *
     * @param stageId 赛段 ID
     * @return 操作成功结果
     */
    @PostMapping("/stages/{stageId}/advancement/auto-assign")
    @SaCheckLogin
    public Result<?> autoAssignAdvancement(@PathVariable String stageId) {
        stageService.autoAssignAdvancement(stageId);
        return Result.success();
    }
}
