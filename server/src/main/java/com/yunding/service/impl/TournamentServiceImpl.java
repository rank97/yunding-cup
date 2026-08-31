package com.yunding.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yunding.common.BizException;
import com.yunding.common.Constants;
import com.yunding.dto.StageCreateDTO;
import com.yunding.dto.TournamentCreateDTO;
import com.yunding.entity.ScoreRule;
import com.yunding.entity.Stage;
import com.yunding.entity.Tournament;
import com.yunding.mapper.ScoreRuleMapper;
import com.yunding.mapper.StageMapper;
import com.yunding.mapper.TournamentMapper;
import com.yunding.service.TournamentService;
import com.yunding.config.SseEmitterManager;
import com.yunding.dto.TournamentUpdateDTO;
import com.yunding.mapper.GameRecordMapper;
import com.yunding.mapper.MatchRoundMapper;
import com.yunding.mapper.StageGroupMapper;
import com.yunding.mapper.UserMapper;
import com.yunding.entity.StageGroup;
import com.yunding.entity.MatchRound;
import com.yunding.entity.GameRecord;
import com.yunding.entity.User;
import com.yunding.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentServiceImpl implements TournamentService {

    private final TournamentMapper tournamentMapper;
    private final StageMapper stageMapper;
    private final ScoreRuleMapper scoreRuleMapper;
    private final StageGroupMapper stageGroupMapper;
    private final MatchRoundMapper matchRoundMapper;
    private final GameRecordMapper gameRecordMapper;
    private final UserMapper userMapper;
    private final MatchService matchService;
    private final SseEmitterManager sseEmitterManager;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Tournament createTournament(TournamentCreateDTO dto, String tenantId) {
        if (dto.getTotalPlayers() == null || dto.getTotalPlayers() < 8 || dto.getTotalPlayers() % 8 != 0) {
            throw new BizException("参赛总人数必须大于等于8且为8的倍数");
        }

        List<StageCreateDTO> stageDTOs = dto.getStages();
        if (stageDTOs == null || stageDTOs.isEmpty()) {
            throw new BizException("至少需要配置一个赛段");
        }

        // 查找或使用默认积分规则
        ScoreRule defaultRule = scoreRuleMapper.selectOne(new LambdaQueryWrapper<ScoreRule>()
                .eq(ScoreRule::getTenantId, tenantId)
                .eq(ScoreRule::getIsSystemDefault, 1));
        String defaultRuleId = defaultRule != null ? defaultRule.getId() : null;

        // 数学闭包合法性校验
        validateStagesClosure(dto.getTotalPlayers(), stageDTOs);

        // 创建赛事
        Tournament tournament = new Tournament();
        tournament.setTenantId(tenantId);
        tournament.setTitle(dto.getTitle());
        tournament.setTotalPlayers(dto.getTotalPlayers());
        tournament.setShareCode(generateUniqueShareCode());
        tournament.setStatus(Constants.TOURNAMENT_DRAFT);
        tournament.setIsDeleted(0);
        tournament.setCreatedAt(new Date());
        tournament.setUpdatedAt(new Date());
        tournamentMapper.insert(tournament);

        String firstStageId = null;
        for (int i = 0; i < stageDTOs.size(); i++) {
            StageCreateDTO sDto = stageDTOs.get(i);
            Stage stage = new Stage();
            stage.setTournamentId(tournament.getId());
            stage.setName(sDto.getName());
            stage.setStageOrder(i + 1);
            
            boolean isFinal = (i == stageDTOs.size() - 1);
            // 如果是最后一个阶段，固定为 20分登顶决赛，最高打满 8 局
            if (isFinal) {
                stage.setStageType(Constants.STAGE_TYPE_CHECKPOINT_FINAL);
                stage.setRoundCount(8);
                stage.setMaxRoundLimit(8);
                stage.setDirectToFinalCount(0);
                stage.setEliminateCount(0);
            } else {
                stage.setStageType(sDto.getStageType() != null ? sDto.getStageType() : Constants.STAGE_TYPE_STANDARD);
                stage.setRoundCount(sDto.getRoundCount() != null ? sDto.getRoundCount() : 3);
                stage.setMaxRoundLimit(null);
                stage.setDirectToFinalCount(sDto.getDirectToFinalCount() != null ? sDto.getDirectToFinalCount() : 0);
                stage.setEliminateCount(sDto.getEliminateCount() != null ? sDto.getEliminateCount() : 0);
            }

            // 第一赛段没有前置底分，恒为 0
            stage.setInheritScores(i == 0 ? 0 : (sDto.getInheritScores() != null ? sDto.getInheritScores() : 0));
            stage.setMaxRoundLimit(isFinal ? Integer.valueOf(8) : sDto.getMaxRoundLimit());
            stage.setScoreRuleId(sDto.getScoreRuleId() != null ? sDto.getScoreRuleId() : defaultRuleId);
            stage.setStatus(Constants.STAGE_PENDING);
            stage.setIsDeleted(0);
            stage.setCreatedAt(new Date());
            stage.setUpdatedAt(new Date());
            stageMapper.insert(stage);

            if (i == 0) {
                firstStageId = stage.getId();
            }
        }

        tournament.setCurrentStageId(firstStageId);
        tournamentMapper.updateById(tournament);

        return tournament;
    }

    @Override
    public List<Tournament> listTournaments(String tenantId, String role) {
        LambdaQueryWrapper<Tournament> wrapper = new LambdaQueryWrapper<Tournament>()
                .eq(Tournament::getIsDeleted, 0)
                .orderByDesc(Tournament::getCreatedAt);

        if (!Constants.ROLE_SUPER_ADMIN.equals(role)) {
            wrapper.eq(Tournament::getTenantId, tenantId);
        }

        List<Tournament> list = tournamentMapper.selectList(wrapper);
        if (!list.isEmpty()) {
            Set<String> tenantIds = list.stream()
                    .map(Tournament::getTenantId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            if (!tenantIds.isEmpty()) {
                Map<String, String> userMap = userMapper.selectBatchIds(tenantIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a));
                list.forEach(t -> t.setCreatorName(userMap.getOrDefault(t.getTenantId(), "未知主办方")));
            }
        }
        return list;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Tournament updateTournament(String tournamentId, TournamentUpdateDTO dto, String tenantId, String role) {
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        if (tournament == null || tournament.getIsDeleted() == 1) {
            throw new BizException("赛事不存在");
        }

        if (!Constants.ROLE_SUPER_ADMIN.equals(role) && !tournament.getTenantId().equals(tenantId)) {
            throw new BizException("无权修改他人创建的赛事");
        }

        if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
            tournament.setTitle(dto.getTitle().trim());
        }

        if (dto.getStages() != null && !dto.getStages().isEmpty()) {
            List<Stage> existingStages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                    .eq(Stage::getTournamentId, tournamentId)
                    .eq(Stage::getIsDeleted, 0)
                    .orderByAsc(Stage::getStageOrder));

            if (dto.getStages().size() != existingStages.size()) {
                throw new BizException("赛段数量必须与原赛事保持一致");
            }

            // 构造用于校验数学闭包的临时赛程列表
            List<StageCreateDTO> stageCheckList = new ArrayList<>();
            for (int i = 0; i < dto.getStages().size(); i++) {
                TournamentUpdateDTO.StageUpdateItemDTO uStage = dto.getStages().get(i);
                Stage eStage = existingStages.get(i);

                StageCreateDTO sc = new StageCreateDTO();
                sc.setName(uStage.getName() != null ? uStage.getName() : eStage.getName());
                sc.setRoundCount(uStage.getRoundCount() != null ? uStage.getRoundCount() : eStage.getRoundCount());
                sc.setDirectToFinalCount(uStage.getDirectToFinalCount() != null ? uStage.getDirectToFinalCount() : eStage.getDirectToFinalCount());
                sc.setEliminateCount(uStage.getEliminateCount() != null ? uStage.getEliminateCount() : eStage.getEliminateCount());
                sc.setInheritScores(i == 0 ? 0 : (uStage.getInheritScores() != null ? uStage.getInheritScores() : eStage.getInheritScores()));
                sc.setStageType(eStage.getStageType());
                stageCheckList.add(sc);
            }

            // 执行数学闭包校验
            validateStagesClosure(tournament.getTotalPlayers(), stageCheckList);

            // 更新各个赛段配置
            for (int i = 0; i < dto.getStages().size(); i++) {
                TournamentUpdateDTO.StageUpdateItemDTO uStage = dto.getStages().get(i);
                Stage eStage = existingStages.get(i);
                boolean isFinal = (i == existingStages.size() - 1);

                // 检查当前赛段是否已有分组或已锁定
                List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                        .eq(StageGroup::getStageId, eStage.getId()));
                boolean hasGrouping = !groups.isEmpty() || !Constants.STAGE_PENDING.equals(eStage.getStatus());

                if (hasGrouping) {
                    // 已有分组信息：严禁修改局数、直通、淘汰、底分等规则（仅允许修改阶段名称）
                    boolean rulesChanged = (!isFinal && uStage.getRoundCount() != null && !uStage.getRoundCount().equals(eStage.getRoundCount()))
                            || (uStage.getDirectToFinalCount() != null && !uStage.getDirectToFinalCount().equals(eStage.getDirectToFinalCount()))
                            || (uStage.getEliminateCount() != null && !uStage.getEliminateCount().equals(eStage.getEliminateCount()))
                            || (uStage.getInheritScores() != null && !uStage.getInheritScores().equals(eStage.getInheritScores()));
                    if (rulesChanged) {
                        throw new BizException(String.format("赛段 [%s] 已生成分组信息，严禁修改赛段规则与局数！如需修改请先在工作台点击【清除分组】。", eStage.getName()));
                    }
                    if (uStage.getName() != null) {
                        eStage.setName(uStage.getName());
                        stageMapper.updateById(eStage);
                    }
                    continue;
                }

                // 未分组的赛段：允许全面修改
                if (uStage.getName() != null) eStage.setName(uStage.getName());
                if (isFinal) {
                    eStage.setRoundCount(8);
                    eStage.setMaxRoundLimit(8);
                    eStage.setDirectToFinalCount(0);
                    eStage.setEliminateCount(0);
                    eStage.setStageType(Constants.STAGE_TYPE_CHECKPOINT_FINAL);
                } else {
                    if (uStage.getRoundCount() != null) eStage.setRoundCount(uStage.getRoundCount());
                    if (uStage.getDirectToFinalCount() != null) eStage.setDirectToFinalCount(uStage.getDirectToFinalCount());
                    if (uStage.getEliminateCount() != null) eStage.setEliminateCount(uStage.getEliminateCount());
                }
                eStage.setInheritScores(i == 0 ? 0 : (uStage.getInheritScores() != null ? uStage.getInheritScores() : 0));
                eStage.setUpdatedAt(new Date());
                stageMapper.updateById(eStage);
            }

            for (Stage s : existingStages) {
                matchService.recalculateStageScores(s);
            }
        }

        tournament.setUpdatedAt(new Date());
        tournamentMapper.updateById(tournament);

        sseEmitterManager.broadcast(tournament.getShareCode(), "TOURNAMENT_UPDATED", tournament);

        return tournament;
    }

    @Override
    public Map<String, Object> getTournamentDetail(String tournamentId, String tenantId, String role) {
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        if (tournament == null || tournament.getIsDeleted() == 1) {
            throw new BizException("赛事不存在");
        }

        if (!Constants.ROLE_SUPER_ADMIN.equals(role) && !tournament.getTenantId().equals(tenantId)) {
            throw new BizException("无权查看他人创建的赛事管理后台");
        }

        List<Stage> stages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournamentId)
                .eq(Stage::getIsDeleted, 0)
                .orderByAsc(Stage::getStageOrder));

        Map<String, Object> map = new HashMap<>();
        map.put("tournament", tournament);
        map.put("stages", stages);
        return map;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStages(String tournamentId, List<StageCreateDTO> stages, String tenantId, String role) {
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        if (tournament == null || tournament.getIsDeleted() == 1) {
            throw new BizException("赛事不存在");
        }

        if (!Constants.ROLE_SUPER_ADMIN.equals(role) && !tournament.getTenantId().equals(tenantId)) {
            throw new BizException("无权修改他人创建的赛事赛段");
        }

        // 校验是否允许修改：如果已有赛段不是 PENDING 状态则不允许修改整体赛程
        Long inProgressCount = stageMapper.selectCount(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournamentId)
                .ne(Stage::getStatus, Constants.STAGE_PENDING));
        if (inProgressCount > 0) {
            throw new BizException("赛事已有赛段开始进行，无法修改赛段流转配置");
        }

        validateStagesClosure(tournament.getTotalPlayers(), stages);

        // 删除旧赛段
        stageMapper.delete(new LambdaQueryWrapper<Stage>().eq(Stage::getTournamentId, tournamentId));

        // 插入新赛段
        for (int i = 0; i < stages.size(); i++) {
            StageCreateDTO sDto = stages.get(i);
            Stage stage = new Stage();
            stage.setTournamentId(tournamentId);
            stage.setName(sDto.getName());
            stage.setStageOrder(i + 1);
            stage.setStageType(i == stages.size() - 1 ? "CHECKPOINT_FINAL" : (sDto.getStageType() != null ? sDto.getStageType() : "STANDARD"));
            stage.setRoundCount(sDto.getRoundCount() != null ? sDto.getRoundCount() : 3);
            stage.setDirectToFinalCount(sDto.getDirectToFinalCount() != null ? sDto.getDirectToFinalCount() : 0);
            stage.setEliminateCount(sDto.getEliminateCount() != null ? sDto.getEliminateCount() : 0);
            // 第一赛段没有前置底分，恒为 0
            stage.setInheritScores(i == 0 ? 0 : (sDto.getInheritScores() != null ? sDto.getInheritScores() : 0));
            stage.setMaxRoundLimit(sDto.getMaxRoundLimit());
            stage.setScoreRuleId(sDto.getScoreRuleId());
            stage.setStatus(Constants.STAGE_PENDING);
            stage.setIsDeleted(0);
            stage.setCreatedAt(new Date());
            stage.setUpdatedAt(new Date());
            stageMapper.insert(stage);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTournament(String tournamentId, String tenantId, String role) {
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        if (tournament == null || tournament.getIsDeleted() == 1) {
            throw new BizException("赛事不存在");
        }

        if (!Constants.ROLE_SUPER_ADMIN.equals(role) && !tournament.getTenantId().equals(tenantId)) {
            throw new BizException("无权删除他人创建的赛事");
        }

        tournament.setIsDeleted(1);
        tournamentMapper.updateById(tournament);

        sseEmitterManager.broadcast(tournament.getShareCode(), "TOURNAMENT_DELETED", Map.of("tournamentId", tournamentId));
    }

    private void validateStagesClosure(int totalPlayers, List<StageCreateDTO> stages) {
        int currentPlayers = totalPlayers;
        int directTotal = 0;

        for (int i = 0; i < stages.size(); i++) {
            StageCreateDTO stage = stages.get(i);
            boolean isFinal = (i == stages.size() - 1);

            if (isFinal) {
                stage.setStageType(Constants.STAGE_TYPE_CHECKPOINT_FINAL);
                stage.setRoundCount(8);
                stage.setDirectToFinalCount(0);
                stage.setEliminateCount(0);

                // 最后一阶段必须恰好汇聚 8 人
                if (directTotal + currentPlayers != 8) {
                    throw new BizException(String.format(
                            "赛程流转闭包失败: 直通决赛总人数(%d人) + 前序最终晋级人数(%d人) = %d人，不等于决赛所需恰好8人！",
                            directTotal, currentPlayers, directTotal + currentPlayers));
                }
            } else {
                int direct = stage.getDirectToFinalCount() != null ? stage.getDirectToFinalCount() : 0;
                int elim = stage.getEliminateCount() != null ? stage.getEliminateCount() : 0;

                int nextPlayers = currentPlayers - direct - elim;
                if (nextPlayers <= 0) {
                    throw new BizException(String.format("赛段 [%s] 晋级人数小于等于0，请调整直通或淘汰人数", stage.getName()));
                }

                if (i < stages.size() - 2 && nextPlayers % 8 != 0) {
                    throw new BizException(String.format(
                            "赛段 [%s] 流转到下一轮的人数(%d人)不是8的倍数，无法组成完整8人房间", stage.getName(), nextPlayers));
                }

                directTotal += direct;
                currentPlayers = nextPlayers;
            }
        }
    }

    private String generateUniqueShareCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        while (true) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            String code = sb.toString();
            Long count = tournamentMapper.selectCount(new LambdaQueryWrapper<Tournament>()
                    .eq(Tournament::getShareCode, code));
            if (count == 0) {
                return code;
            }
        }
    }
}
