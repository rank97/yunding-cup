package com.yunding.controller;

import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.stp.StpUtil;
import com.yunding.common.Result;
import com.yunding.dto.StageCreateDTO;
import com.yunding.dto.TournamentCreateDTO;
import com.yunding.dto.TournamentUpdateDTO;
import com.yunding.entity.Tournament;
import com.yunding.service.TournamentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 赛事主体与多阶段编排控制器
 * <p>
 * 负责赛事的创建、列表检索（租户数据隔离/超级管理员全局查看）、赛事详情查询、
 * 赛事名称及阶段流水赛制修改，以及安全逻辑删除等中台管理功能。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@RestController
@RequestMapping("/api/v1/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;

    /**
     * 创建全新赛事及初始赛段流水配置
     *
     * @param dto 赛事创建参数（标题、总人数规模、各赛段晋级淘汰配置）
     * @return 创建成功的赛事实体（含唯一生成的 8 位观赛码）
     */
    @PostMapping
    @SaCheckLogin
    public Result<Tournament> createTournament(@RequestBody @Valid TournamentCreateDTO dto) {
        String tenantId = (String) StpUtil.getLoginId();
        return Result.success(tournamentService.createTournament(dto, tenantId));
    }

    /**
     * 查询当前用户有权管理的赛事列表
     * <p>
     * 超级管理员可查阅全系统所有赛事；普通主办方仅查阅自身创建的赛事。
     * </p>
     *
     * @return 赛事列表
     */
    @GetMapping
    @SaCheckLogin
    public Result<List<Tournament>> listTournaments() {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        return Result.success(tournamentService.listTournaments(tenantId, role));
    }

    /**
     * 查询单场赛事的综合管理详情（含各阶段状态与选手名册统计）
     *
     * @param id 赛事 ID
     * @return 赛事综合详情 Map
     */
    @GetMapping("/{id}")
    @SaCheckLogin
    public Result<Map<String, Object>> getTournamentDetail(@PathVariable String id) {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        return Result.success(tournamentService.getTournamentDetail(id, tenantId, role));
    }

    /**
     * 修改赛事基础信息（如: 赛事标题）
     *
     * @param id  赛事 ID
     * @param dto 修改参数
     * @return 更新后的赛事实体
     */
    @PutMapping("/{id}")
    @SaCheckLogin
    public Result<Tournament> updateTournament(@PathVariable String id, @RequestBody @Valid TournamentUpdateDTO dto) {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        return Result.success(tournamentService.updateTournament(id, dto, tenantId, role));
    }

    /**
     * 调整并重构赛事的流转阶段配置
     * <p>
     * 仅允许在赛事草稿阶段（未产生实际对局成绩前）修改赛制流水与阶段定义。
     * </p>
     *
     * @param id     赛事 ID
     * @param stages 赛段配置列表
     * @return 操作成功结果
     */
    @PutMapping("/{id}/stages")
    @SaCheckLogin
    public Result<?> updateStages(@PathVariable String id, @RequestBody List<StageCreateDTO> stages) {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        tournamentService.updateStages(id, stages, tenantId, role);
        return Result.success();
    }

    /**
     * 逻辑删除赛事（同时清理关联赛段、分组与战报数据）
     *
     * @param id 赛事 ID
     * @return 操作成功结果
     */
    @DeleteMapping("/{id}")
    @SaCheckLogin
    public Result<?> deleteTournament(@PathVariable String id) {
        String tenantId = (String) StpUtil.getLoginId();
        String role = (String) StpUtil.getSession().get("role");
        tournamentService.deleteTournament(id, tenantId, role);
        return Result.success();
    }
}
