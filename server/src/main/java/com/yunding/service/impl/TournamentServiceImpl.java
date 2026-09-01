package com.yunding.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yunding.common.BizException;
import com.yunding.common.Constants;
import com.yunding.config.SseEmitterManager;
import com.yunding.dto.StageCreateDTO;
import com.yunding.dto.TournamentCreateDTO;
import com.yunding.dto.TournamentUpdateDTO;
import com.yunding.entity.*;
import com.yunding.mapper.*;
import com.yunding.service.MatchService;
import com.yunding.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 赛事主体与多阶段流水编排业务实现类
 *
 * @author TFT-TourneyOS Team
 */
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
    private final StagePlayerStateMapper stagePlayerStateMapper;
    private final MatchService matchService;
    private final SseEmitterManager sseEmitterManager;

    /**
     * 权限校验拦截辅助方法
     */
    private void checkPermission(Tournament tournament, String tenantId, String role) {
        if (tournament == null || tournament.getIsDeleted() == 1) {
            throw new BizException("赛事不存在或已被删除");
        }
        if (Constants.ROLE_SUPER_ADMIN.equals(role)) {
            return;
        }
        if (!tournament.getTenantId().equals(tenantId)) {
            throw new BizException("无权操作他人创建的赛事");
        }
    }

    /**
     * 创建全新赛事及初始赛段流水配置
     */
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

        // 查找或使用默认积分规则模板
        ScoreRule defaultRule = scoreRuleMapper.selectOne(new LambdaQueryWrapper<ScoreRule>()
                .eq(ScoreRule::getTenantId, tenantId)
                .eq(ScoreRule::getIsSystemDefault, 1));
        String defaultRuleId = defaultRule != null ? defaultRule.getId() : null;

        // 执行多阶段流转人数数学闭包合法性校验
        validateStagesClosure(dto.getTotalPlayers(), stageDTOs);

        // 1. 创建赛事主表记录
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

        // 2. 依次生成赛段配置
        String firstStageId = null;
        for (int i = 0; i < stageDTOs.size(); i++) {
            StageCreateDTO sDto = stageDTOs.get(i);
            Stage stage = new Stage();
            stage.setTournamentId(tournament.getId());
            stage.setName(sDto.getName());
            stage.setStageOrder(i + 1);

            boolean isFinal = (i == stageDTOs.size() - 1);
            // 若为最终阶段，固定为 20 分登顶赛点制决赛（最高打满 8 局）
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

            stage.setInheritScores(sDto.getInheritScores() != null ? sDto.getInheritScores() : 0);
            String ruleId = (sDto.getScoreRuleId() != null && !sDto.getScoreRuleId().isBlank())
                    ? sDto.getScoreRuleId()
                    : (defaultRuleId != null ? defaultRuleId : "1");
            stage.setScoreRuleId(ruleId);
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

    /**
     * 查询当前用户有权限管理的赛事列表
     */
    @Override
    public List<Tournament> listTournaments(String tenantId, String role) {
        LambdaQueryWrapper<Tournament> wrapper = new LambdaQueryWrapper<Tournament>()
                .eq(Tournament::getIsDeleted, 0);

        if (!Constants.ROLE_SUPER_ADMIN.equals(role)) {
            wrapper.eq(Tournament::getTenantId, tenantId);
        }

        wrapper.orderByDesc(Tournament::getCreatedAt);
        List<Tournament> list = tournamentMapper.selectList(wrapper);

        // 填充创建者昵称信息
        Map<String, String> userMap = userMapper.selectList(null).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername, (k1, k2) -> k1));
        for (Tournament t : list) {
            t.setCreatorName(userMap.getOrDefault(t.getTenantId(), "未知用户"));
        }

        return list;
    }

    /**
     * 查询单场赛事综合详情
     */
    @Override
    public Map<String, Object> getTournamentDetail(String tournamentId, String tenantId, String role) {
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        checkPermission(tournament, tenantId, role);

        List<Stage> stages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournamentId)
                .eq(Stage::getIsDeleted, 0)
                .orderByAsc(Stage::getStageOrder));

        Map<String, Object> result = new HashMap<>();
        result.put("tournament", tournament);
        result.put("stages", stages);
        return result;
    }

    /**
     * 修改赛事基础信息及各赛段规则参数
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Tournament updateTournament(String tournamentId, TournamentUpdateDTO dto, String tenantId, String role) {
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        checkPermission(tournament, tenantId, role);

        if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
            tournament.setTitle(dto.getTitle().trim());
            tournament.setUpdatedAt(new Date());
            tournamentMapper.updateById(tournament);
        }

        // 处理赛段更新
        if (dto.getStages() != null && !dto.getStages().isEmpty()) {
            List<Stage> existingStages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                    .eq(Stage::getTournamentId, tournamentId)
                    .eq(Stage::getIsDeleted, 0)
                    .orderByAsc(Stage::getStageOrder));

            Map<String, Stage> stageMap = existingStages.stream()
                    .collect(Collectors.toMap(Stage::getId, s -> s, (k1, k2) -> k1));

            for (int i = 0; i < dto.getStages().size(); i++) {
                TournamentUpdateDTO.StageUpdateItemDTO sDto = dto.getStages().get(i);
                Stage targetStage = null;
                if (sDto.getId() != null) {
                    targetStage = stageMap.get(sDto.getId());
                }
                if (targetStage == null && i < existingStages.size()) {
                    targetStage = existingStages.get(i);
                }
                if (targetStage == null) continue;

                boolean isFinal = (targetStage.getStageOrder() != null && targetStage.getStageOrder() == existingStages.size());

                // 1. 更新阶段名称（无论开赛与否均可修改）
                if (sDto.getName() != null && !sDto.getName().trim().isEmpty()) {
                    targetStage.setName(sDto.getName().trim());
                }

                // 2. 检查该赛段是否已经开赛录入了小局战绩
                boolean hasRecords = false;
                List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                        .eq(StageGroup::getStageId, targetStage.getId()));
                if (!groups.isEmpty()) {
                    List<String> groupIds = groups.stream().map(StageGroup::getId).toList();
                    List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                            .in(MatchRound::getStageGroupId, groupIds));
                    if (!rounds.isEmpty()) {
                        List<String> roundIds = rounds.stream().map(MatchRound::getId).toList();
                        Long count = gameRecordMapper.selectCount(new LambdaQueryWrapper<GameRecord>()
                                .in(GameRecord::getMatchRoundId, roundIds));
                        hasRecords = (count != null && count > 0);
                    }
                }

                // 未产生对局战绩时（如 PENDING 待开赛、或已产生晋级名单但未生成对局开打），允许调整赛制、积分规则与底分继承
                if (!hasRecords) {
                    if (!isFinal) {
                        if (sDto.getRoundCount() != null && sDto.getRoundCount() > 0) {
                            targetStage.setRoundCount(sDto.getRoundCount());
                        }
                        if (sDto.getDirectToFinalCount() != null) {
                            targetStage.setDirectToFinalCount(sDto.getDirectToFinalCount());
                        }
                        if (sDto.getEliminateCount() != null) {
                            targetStage.setEliminateCount(sDto.getEliminateCount());
                        }
                        if (sDto.getScoreRuleId() != null && !sDto.getScoreRuleId().isBlank()) {
                            targetStage.setScoreRuleId(sDto.getScoreRuleId());
                        }
                    }

                    // 检查底分继承设置
                    if (sDto.getInheritScores() != null) {
                        int oldInherit = targetStage.getInheritScores() != null ? targetStage.getInheritScores() : 0;
                        int newInherit = isFinal ? 0 : sDto.getInheritScores();
                        targetStage.setInheritScores(newInherit);

                        // 若底分继承设置发生变更，且该赛段已有选手记录（如从上一赛段晋级而来），即时重算所有选手的 carryOverScore 与 totalScore
                        if (oldInherit != newInherit) {
                            List<StagePlayerState> currentStates = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                                    .eq(StagePlayerState::getStageId, targetStage.getId()));

                            if (!currentStates.isEmpty()) {
                                for (StagePlayerState sps : currentStates) {
                                    int newCarry = 0;
                                    if (newInherit == 1) {
                                        // 寻找该选手在紧邻上一赛段的累积总积分
                                        final int currentOrder = targetStage.getStageOrder();
                                        Stage prevStage = existingStages.stream()
                                                .filter(ps -> ps.getStageOrder() != null && ps.getStageOrder() == currentOrder - 1)
                                                .findFirst()
                                                .orElse(null);
                                        if (prevStage != null) {
                                            StagePlayerState prevState = stagePlayerStateMapper.selectOne(new LambdaQueryWrapper<StagePlayerState>()
                                                    .eq(StagePlayerState::getStageId, prevStage.getId())
                                                    .eq(StagePlayerState::getPlayerId, sps.getPlayerId()));
                                            if (prevState != null && prevState.getTotalScore() != null) {
                                                newCarry = prevState.getTotalScore();
                                            }
                                        }
                                    }
                                    sps.setCarryOverScore(newCarry);
                                    int stgScore = sps.getStageScore() != null ? sps.getStageScore() : 0;
                                    sps.setTotalScore(newCarry + stgScore);
                                    stagePlayerStateMapper.updateById(sps);
                                }
                            }
                        }
                    }
                }

                targetStage.setUpdatedAt(new Date());
                stageMapper.updateById(targetStage);
            }
        }

        // 广播大屏与客户端更新
        sseEmitterManager.broadcast(tournament.getShareCode(), "TOURNAMENT_UPDATED", Map.of(
                "tournamentId", tournament.getId(),
                "title", tournament.getTitle(),
                "action", "STAGES_UPDATED"
        ));

        return tournament;
    }

    /**
     * 调整并重构赛事的流转阶段配置
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStages(String tournamentId, List<StageCreateDTO> stageDTOs, String tenantId, String role) {
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        checkPermission(tournament, tenantId, role);

        if (stageDTOs == null || stageDTOs.isEmpty()) {
            throw new BizException("至少需要配置一个赛段");
        }

        // 安全拦截：检查是否已有对局录入了成绩
        List<Stage> existingStages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournamentId)
                .eq(Stage::getIsDeleted, 0));
        List<String> stageIds = existingStages.stream().map(Stage::getId).toList();

        if (!stageIds.isEmpty()) {
            List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                    .in(StageGroup::getStageId, stageIds));
            List<String> groupIds = groups.stream().map(StageGroup::getId).toList();
            if (!groupIds.isEmpty()) {
                List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                        .in(MatchRound::getStageGroupId, groupIds));
                List<String> roundIds = rounds.stream().map(MatchRound::getId).toList();
                if (!roundIds.isEmpty()) {
                    Long count = gameRecordMapper.selectCount(new LambdaQueryWrapper<GameRecord>()
                            .in(GameRecord::getMatchRoundId, roundIds));
                    if (count > 0) {
                        throw new BizException("赛事已有阶段开始比赛并录入了成绩，严禁重新修改赛程流水！");
                    }
                }
            }
        }

        // 校验人数数学闭包
        validateStagesClosure(tournament.getTotalPlayers(), stageDTOs);

        // 逻辑删除旧赛段
        for (Stage s : existingStages) {
            s.setIsDeleted(1);
            s.setUpdatedAt(new Date());
            stageMapper.updateById(s);
        }

        // 重新插入新赛段
        String firstStageId = null;
        for (int i = 0; i < stageDTOs.size(); i++) {
            StageCreateDTO sDto = stageDTOs.get(i);
            Stage stage = new Stage();
            stage.setTournamentId(tournament.getId());
            stage.setName(sDto.getName());
            stage.setStageOrder(i + 1);

            boolean isFinal = (i == stageDTOs.size() - 1);
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

            stage.setInheritScores(sDto.getInheritScores() != null ? sDto.getInheritScores() : 0);
            String ruleId = (sDto.getScoreRuleId() != null && !sDto.getScoreRuleId().isBlank())
                    ? sDto.getScoreRuleId()
                    : "1";
            stage.setScoreRuleId(ruleId);
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

        sseEmitterManager.broadcast(tournament.getShareCode(), "TOURNAMENT_UPDATED", Map.of(
                "tournamentId", tournament.getId(),
                "action", "STAGES_UPDATED"
        ));
    }

    /**
     * 逻辑删除赛事
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTournament(String tournamentId, String tenantId, String role) {
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        checkPermission(tournament, tenantId, role);

        tournament.setIsDeleted(1);
        tournament.setUpdatedAt(new Date());
        tournamentMapper.updateById(tournament);

        // 逻辑删除下属所有赛段
        List<Stage> stages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournamentId));
        for (Stage s : stages) {
            s.setIsDeleted(1);
            s.setUpdatedAt(new Date());
            stageMapper.updateById(s);
        }
    }

    /**
     * 多阶段人数流转数学闭包合法性校验算法
     * <p>
     * 核心规则：
     * 1. 每一前序赛段的参赛人数必须是 8 的倍数（满足云顶之弈 8 人一桌特性）；
     * 2. 前序赛段直通总决赛的人数 + 晋级下一阶段的人数 + 淘汰人数 == 本阶段参赛人数；
     * 3. 中间赛段晋级下一轮人数必须是 8 的倍数（除非下一阶段就是总决赛）；
     * 4. 最终总决赛人数必须恰好等于 8 人（累积所有前序赛段直通决赛名额 + 倒数第二阶段常规晋级名额）。
     * </p>
     *
     * @param totalPlayers 赛事总规模
     * @param stages       赛段列表
     */
    private void validateStagesClosure(int totalPlayers, List<StageCreateDTO> stages) {
        int currentInput = totalPlayers;
        int accumulatedDirectToFinal = 0;

        for (int i = 0; i < stages.size(); i++) {
            StageCreateDTO s = stages.get(i);
            boolean isFinal = (i == stages.size() - 1);

            if (isFinal) {
                if (i == 0) {
                    if (currentInput != 8) {
                        throw new BizException(String.format("单决赛赛制参赛人数必须刚好为 8 人，当前为 %d 人", currentInput));
                    }
                } else {
                    int expectedFinalists = currentInput + accumulatedDirectToFinal;
                    if (expectedFinalists != 8) {
                        throw new BizException(String.format("决赛阶段应恰好为 8 人参赛，但根据您的流水计算（常规晋级 %d 人 + 历史直通决赛 %d 人）合计为 %d 人！",
                                currentInput, accumulatedDirectToFinal, expectedFinalists));
                    }
                }
            } else {
                if (currentInput < 8 || currentInput % 8 != 0) {
                    throw new BizException(String.format("第 %d 阶段 [%s] 输入参赛人数为 %d 人，不是 8 的倍数，无法正常分桌！",
                            i + 1, s.getName(), currentInput));
                }

                int direct = s.getDirectToFinalCount() != null ? s.getDirectToFinalCount() : 0;
                int eliminate = s.getEliminateCount() != null ? s.getEliminateCount() : 0;

                if (direct < 0 || eliminate < 0) {
                    throw new BizException(String.format("第 %d 阶段 [%s] 直通或淘汰人数不能为负数", i + 1, s.getName()));
                }

                if (direct + eliminate >= currentInput) {
                    throw new BizException(String.format("第 %d 阶段 [%s] 直通人数 (%d) + 淘汰人数 (%d) 超过或等于本阶段总人数 (%d)，没有选手能晋级下一阶段！",
                            i + 1, s.getName(), direct, eliminate, currentInput));
                }

                int regularAdvance = currentInput - direct - eliminate;
                if (i < stages.size() - 2 && (regularAdvance < 8 || regularAdvance % 8 != 0)) {
                    throw new BizException(String.format("第 %d 阶段 [%s] 晋级至下一轮的人数 (%d人) 不是 8 的倍数，无法组成完整 8 人房间！",
                            i + 1, s.getName(), regularAdvance));
                }

                accumulatedDirectToFinal += direct;
                currentInput = regularAdvance;
            }
        }
    }

    /**
     * 生成全网唯一的 8 位大写字母与数字观赛分享码
     */
    private String generateUniqueShareCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        for (int retry = 0; retry < 20; retry++) {
            StringBuilder sb = new StringBuilder(8);
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
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
