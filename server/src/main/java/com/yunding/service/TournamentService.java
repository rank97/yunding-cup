package com.yunding.service;

import com.yunding.dto.StageCreateDTO;
import com.yunding.dto.TournamentCreateDTO;
import com.yunding.dto.TournamentUpdateDTO;
import com.yunding.entity.Tournament;

import java.util.List;
import java.util.Map;

/**
 * 赛事主体与多阶段编排业务接口
 *
 * @author TFT-TourneyOS Team
 */
public interface TournamentService {

    /**
     * 创建全新赛事及初始赛段流水配置（执行数学闭包合法性校验）
     *
     * @param dto      创建参数
     * @param tenantId 所属主办方租户 ID
     * @return 赛事实体
     */
    Tournament createTournament(TournamentCreateDTO dto, String tenantId);

    /**
     * 查询赛事列表（支持多租户数据隔离与超管全局查看）
     *
     * @param tenantId 租户 ID
     * @param role     角色标识
     * @return 赛事列表
     */
    List<Tournament> listTournaments(String tenantId, String role);

    /**
     * 查询单场赛事综合详情
     *
     * @param tournamentId 赛事 ID
     * @param tenantId     租户 ID
     * @param role         角色标识
     * @return 赛事详情 Map
     */
    Map<String, Object> getTournamentDetail(String tournamentId, String tenantId, String role);

    /**
     * 修改赛事基础信息（如: 标题）
     *
     * @param tournamentId 赛事 ID
     * @param dto          更新参数
     * @param tenantId     租户 ID
     * @param role         角色标识
     * @return 赛事实体
     */
    Tournament updateTournament(String tournamentId, TournamentUpdateDTO dto, String tenantId, String role);

    /**
     * 调整并重构赛事的流转阶段配置
     *
     * @param tournamentId 赛事 ID
     * @param stages       新赛段列表
     * @param tenantId     租户 ID
     * @param role         角色标识
     */
    void updateStages(String tournamentId, List<StageCreateDTO> stages, String tenantId, String role);

    /**
     * 逻辑删除赛事及其所有关联赛段与成绩数据
     *
     * @param tournamentId 赛事 ID
     * @param tenantId     租户 ID
     * @param role         角色标识
     */
    void deleteTournament(String tournamentId, String tenantId, String role);
}
