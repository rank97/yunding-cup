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

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class StageController {

    private final StageService stageService;

    @PostMapping("/tournaments/{tournamentId}/players/batch")
    @SaCheckLogin
    public Result<?> importPlayers(@PathVariable String tournamentId, @RequestBody PlayerBatchImportDTO dto) {
        dto.setTournamentId(tournamentId);
        stageService.importPlayers(dto);
        return Result.success();
    }

    @GetMapping("/tournaments/{tournamentId}/players")
    @SaCheckLogin
    public Result<List<Player>> listPlayers(@PathVariable String tournamentId) {
        return Result.success(stageService.listPlayers(tournamentId));
    }

    @PutMapping("/players/{playerId}")
    @SaCheckLogin
    public Result<Player> updatePlayer(@PathVariable String playerId, @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String gameId = body.get("gameId");
        String avatarUrl = body.get("avatarUrl");
        return Result.success(stageService.updatePlayer(playerId, name, gameId, avatarUrl));
    }

    @GetMapping("/stages/{stageId}")
    @SaCheckLogin
    public Result<Map<String, Object>> getStageDetail(@PathVariable String stageId) {
        return Result.success(stageService.getStageDetail(stageId));
    }

    @PostMapping("/stages/{stageId}/grouping")
    @SaCheckLogin
    public Result<?> executeGrouping(@PathVariable String stageId, @RequestBody @Valid GroupingReqDTO dto) {
        stageService.executeGrouping(stageId, dto.getMode());
        return Result.success();
    }

    @PostMapping("/stages/{stageId}/swap-players")
    @SaCheckLogin
    public Result<?> swapPlayers(@PathVariable String stageId, @RequestBody Map<String, String> body) {
        String player1Id = body.get("player1Id");
        String player2Id = body.get("player2Id");
        stageService.swapPlayers(stageId, player1Id, player2Id);
        return Result.success();
    }

    @PostMapping("/stages/{stageId}/clear-grouping")
    @SaCheckLogin
    public Result<?> clearGrouping(@PathVariable String stageId) {
        stageService.clearGrouping(stageId);
        return Result.success();
    }

    @PostMapping("/stages/{stageId}/lock")
    @SaCheckLogin
    public Result<?> lockStage(@PathVariable String stageId) {
        stageService.lockStage(stageId);
        return Result.success();
    }

    @PostMapping("/stages/{stageId}/unlock")
    @SaCheckLogin
    public Result<?> unlockStage(@PathVariable String stageId) {
        stageService.unlockStage(stageId);
        return Result.success();
    }
}
