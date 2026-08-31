package com.yunding.controller;

import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.stp.StpUtil;
import com.yunding.common.Result;
import com.yunding.dto.StageCreateDTO;
import com.yunding.dto.TournamentCreateDTO;
import com.yunding.entity.Tournament;
import com.yunding.service.TournamentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;

    @PostMapping
    @SaCheckLogin
    public Result<Tournament> createTournament(@RequestBody @Valid TournamentCreateDTO dto) {
        String tenantId = (String) StpUtil.getLoginId();
        return Result.success(tournamentService.createTournament(dto, tenantId));
    }

    @GetMapping
    @SaCheckLogin
    public Result<List<Tournament>> listTournaments() {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        return Result.success(tournamentService.listTournaments(tenantId, role));
    }

    @GetMapping("/{id}")
    @SaCheckLogin
    public Result<Map<String, Object>> getTournamentDetail(@PathVariable String id) {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        return Result.success(tournamentService.getTournamentDetail(id, tenantId, role));
    }

    @PutMapping("/{id}")
    @SaCheckLogin
    public Result<Tournament> updateTournament(@PathVariable String id, @RequestBody @Valid com.yunding.dto.TournamentUpdateDTO dto) {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        return Result.success(tournamentService.updateTournament(id, dto, tenantId, role));
    }

    @PutMapping("/{id}/stages")
    @SaCheckLogin
    public Result<?> updateStages(@PathVariable String id, @RequestBody List<StageCreateDTO> stages) {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        tournamentService.updateStages(id, stages, tenantId, role);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @SaCheckLogin
    public Result<?> deleteTournament(@PathVariable String id) {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        tournamentService.deleteTournament(id, tenantId, role);
        return Result.success();
    }
}
