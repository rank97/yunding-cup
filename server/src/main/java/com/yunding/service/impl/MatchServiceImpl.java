package com.yunding.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yunding.common.BizException;
import com.yunding.common.Constants;
import com.yunding.config.SseEmitterManager;
import com.yunding.dto.RoundRecordSubmitDTO;
import com.yunding.entity.*;
import com.yunding.mapper.*;
import com.yunding.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchServiceImpl implements MatchService {

    private final MatchRoundMapper matchRoundMapper;
    private final StageGroupMapper stageGroupMapper;
    private final StageMapper stageMapper;
    private final TournamentMapper tournamentMapper;
    private final GameRecordMapper gameRecordMapper;
    private final StagePlayerStateMapper stagePlayerStateMapper;
    private final ScoreRuleMapper scoreRuleMapper;
    private final SseEmitterManager sseEmitterManager;
    private final ObjectMapper objectMapper;

    private void checkMatchRoundPermission(String matchRoundId) {
        String loginId = (String) StpUtil.getLoginIdDefaultNull();
        if (loginId == null) return;
        String role = (String) StpUtil.getSession().get("role");
        if (Constants.ROLE_SUPER_ADMIN.equals(role)) return;

        MatchRound round = matchRoundMapper.selectById(matchRoundId);
        if (round == null) throw new BizException("对局不存在");
        StageGroup group = stageGroupMapper.selectById(round.getStageGroupId());
        if (group == null) throw new BizException("分组不存在");
        Stage stage = stageMapper.selectById(group.getStageId());
        if (stage == null) throw new BizException("赛段不存在");
        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        if (tournament == null || tournament.getIsDeleted() == 1) throw new BizException("赛事不存在");
        if (!tournament.getTenantId().equals(loginId)) {
            throw new BizException("无权操作他人创建的赛事比分");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submitRoundRecord(String matchRoundId, RoundRecordSubmitDTO dto) {
        checkMatchRoundPermission(matchRoundId);
        MatchRound round = matchRoundMapper.selectById(matchRoundId);
        if (round == null) {
            throw new BizException("对局不存在");
        }

        StageGroup group = stageGroupMapper.selectById(round.getStageGroupId());
        Stage stage = stageMapper.selectById(group.getStageId());
        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        if (Constants.STAGE_LOCKED.equals(stage.getStatus()) || (tournament != null && Constants.TOURNAMENT_COMPLETED.equals(tournament.getStatus()))) {
            throw new BizException("当前赛段已锁定（或总决赛已决出冠军完赛），严禁再录入或修改成绩！如需调整比分请先在上方点击【解锁赛段】。");
        }

        List<RoundRecordSubmitDTO.PlayerRecordItem> items = dto.getRecords();
        if (items == null || items.size() != 8) {
            throw new BizException("对局成绩必须包含完整的 8 位选手");
        }

        // 校验名次是否包含且仅包含 1~8 各一人
        Set<Integer> rankSet = new HashSet<>();
        Set<String> playerSet = new HashSet<>();
        for (RoundRecordSubmitDTO.PlayerRecordItem item : items) {
            if (item.getRank() == null || item.getRank() < 1 || item.getRank() > 8) {
                throw new BizException("名次必须在 1~8 之间");
            }
            rankSet.add(item.getRank());
            playerSet.add(item.getPlayerId());
        }

        if (rankSet.size() != 8) {
            throw new BizException("名次存在重复或未分配项，1~8 名必须各占一人");
        }
        if (playerSet.size() != 8) {
            throw new BizException("选手存在重复，单局必须为 8 位不同选手");
        }

        // 获取积分规则
        Map<String, Integer> scoreMap = getScoreMapping(stage.getScoreRuleId());

        // 清理当前局旧数据并插入新战绩
        gameRecordMapper.delete(new LambdaQueryWrapper<GameRecord>().eq(GameRecord::getMatchRoundId, matchRoundId));
        Date now = new Date();
        for (RoundRecordSubmitDTO.PlayerRecordItem item : items) {
            GameRecord record = new GameRecord();
            record.setMatchRoundId(matchRoundId);
            record.setPlayerId(item.getPlayerId());
            record.setRank(item.getRank());
            int score = scoreMap.getOrDefault(String.valueOf(item.getRank()), 9 - item.getRank());
            record.setScore(score);
            record.setCreatedAt(now);
            record.setUpdatedAt(now);
            gameRecordMapper.insert(record);
        }

        round.setStatus(Constants.ROUND_FINISHED);
        matchRoundMapper.updateById(round);

        if (Constants.STAGE_GROUPED.equals(stage.getStatus())) {
            stage.setStatus(Constants.STAGE_IN_PROGRESS);
            stageMapper.updateById(stage);
        }

        // 重新计算本赛段所有选手的累计成绩
        recalculateStageScores(stage);

        // 触发实时大屏推流
        sseEmitterManager.broadcast(tournament.getShareCode(), "SCORE_UPDATED", Map.of(
                "stageId", stage.getId(),
                "matchRoundId", matchRoundId,
                "groupName", group.getGroupName(),
                "roundNumber", round.getRoundNumber()
        ));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetRoundRecord(String matchRoundId) {
        checkMatchRoundPermission(matchRoundId);
        MatchRound round = matchRoundMapper.selectById(matchRoundId);
        if (round == null) {
            throw new BizException("对局不存在");
        }

        StageGroup group = stageGroupMapper.selectById(round.getStageGroupId());
        Stage stage = stageMapper.selectById(group.getStageId());
        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        if (Constants.STAGE_LOCKED.equals(stage.getStatus()) || (tournament != null && Constants.TOURNAMENT_COMPLETED.equals(tournament.getStatus()))) {
            throw new BizException("当前赛段已锁定（或总决赛已决出冠军完赛），严禁作废重置成绩！如需调整比分请先在上方点击【解锁赛段】。");
        }

        gameRecordMapper.delete(new LambdaQueryWrapper<GameRecord>().eq(GameRecord::getMatchRoundId, matchRoundId));
        round.setStatus(Constants.ROUND_PENDING);
        matchRoundMapper.updateById(round);

        recalculateStageScores(stage);

        sseEmitterManager.broadcast(tournament.getShareCode(), "ROUND_RESET", Map.of(
                "stageId", stage.getId(),
                "matchRoundId", matchRoundId
        ));
    }

    @Override
    public void recalculateStageScores(String stageId) {
        Stage stage = stageMapper.selectById(stageId);
        if (stage != null) {
            recalculateStageScores(stage);
        }
    }

    @Override
    public void recalculateStageScores(Stage stage) {
        // 查找本赛段所有组的所有小局
        List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stage.getId()));
        List<String> groupIds = groups.stream().map(StageGroup::getId).toList();

        List<MatchRound> allRounds = new ArrayList<>();
        if (!groupIds.isEmpty()) {
            allRounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                    .in(MatchRound::getStageGroupId, groupIds));
        }
        List<String> roundIds = allRounds.stream().map(MatchRound::getId).toList();

        List<GameRecord> allRecords = new ArrayList<>();
        if (!roundIds.isEmpty()) {
            allRecords = gameRecordMapper.selectList(new LambdaQueryWrapper<GameRecord>()
                    .in(GameRecord::getMatchRoundId, roundIds));
        }

        // 按 playerId 聚合成绩
        Map<String, List<GameRecord>> playerRecordMap = allRecords.stream()
                .collect(Collectors.groupingBy(GameRecord::getPlayerId));

        List<StagePlayerState> states = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                .eq(StagePlayerState::getStageId, stage.getId()));

        boolean isFinalStage = "CHECKPOINT_FINAL".equalsIgnoreCase(stage.getStageType());
        boolean inherit = stage.getInheritScores() != null && stage.getInheritScores() == 1;

        // 查找当前赛段之前的所有赛段（按 stageOrder 降序）
        List<Stage> prevStages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, stage.getTournamentId())
                .lt(Stage::getStageOrder, stage.getStageOrder())
                .orderByDesc(Stage::getStageOrder));

        for (StagePlayerState state : states) {
            List<GameRecord> pRecords = playerRecordMap.getOrDefault(state.getPlayerId(), Collections.emptyList());
            int stageScore = 0;
            int firstPlaces = 0;
            int top4s = 0;

            for (GameRecord r : pRecords) {
                stageScore += r.getScore();
                if (r.getRank() == 1) {
                    firstPlaces++;
                }
                if (r.getRank() <= 4) {
                    top4s++;
                }
            }

            // 实时动态计算底分：如果开启 inheritScores，从该选手最近一次有分数的上一赛段获取总分
            int carryScore = 0;
            if (inherit && !prevStages.isEmpty()) {
                for (Stage ps : prevStages) {
                    StagePlayerState prevState = stagePlayerStateMapper.selectOne(new LambdaQueryWrapper<StagePlayerState>()
                            .eq(StagePlayerState::getStageId, ps.getId())
                            .eq(StagePlayerState::getPlayerId, state.getPlayerId()));
                    if (prevState != null && prevState.getTotalScore() != null) {
                        carryScore = prevState.getTotalScore();
                        break;
                    }
                }
            }

            state.setCarryOverScore(carryScore);
            state.setStageScore(stageScore);
            int totalScore = carryScore + stageScore;
            state.setTotalScore(totalScore);
            state.setFirstPlaceCount(firstPlaces);
            state.setTop4Count(top4s);

            // 决赛 20 分赛点判定
            if (isFinalStage) {
                state.setIsMatchPoint(totalScore >= 20 ? 1 : 0);
            }

            stagePlayerStateMapper.updateById(state);
        }

        // 登顶夺冠逻辑判定（针对 CHECKPOINT_FINAL）
        String checkmateWinnerId = null;
        Integer checkmateRoundNumber = null;

        if (isFinalStage) {
            List<MatchRound> finishedRounds = allRounds.stream()
                    .filter(r -> Constants.ROUND_FINISHED.equals(r.getStatus()))
                    .sorted(Comparator.comparing(MatchRound::getRoundNumber))
                    .toList();

            Map<String, Integer> runningScores = new HashMap<>();
            for (StagePlayerState state : states) {
                runningScores.put(state.getPlayerId(), state.getCarryOverScore() != null ? state.getCarryOverScore() : 0);
            }

            for (MatchRound mr : finishedRounds) {
                List<GameRecord> rRecords = gameRecordMapper.selectList(new LambdaQueryWrapper<GameRecord>()
                        .eq(GameRecord::getMatchRoundId, mr.getId()));

                // 检查本局吃鸡者在开赛前是否已经达到 20 分（拥有赛点）
                for (GameRecord gr : rRecords) {
                    int prevScore = runningScores.getOrDefault(gr.getPlayerId(), 0);
                    if (gr.getRank() == 1 && prevScore >= 20) {
                        checkmateWinnerId = gr.getPlayerId();
                        checkmateRoundNumber = mr.getRoundNumber();
                        break;
                    }
                }

                if (checkmateWinnerId != null) {
                    break;
                }

                for (GameRecord gr : rRecords) {
                    runningScores.put(gr.getPlayerId(), runningScores.getOrDefault(gr.getPlayerId(), 0) + gr.getScore());
                }
            }
        }

        // 如果赛段未锁定，检查是否满足结赛条件
        if (!Constants.STAGE_LOCKED.equals(stage.getStatus())) {
            boolean allRoundsFinished = !allRounds.isEmpty() && allRounds.stream().allMatch(r -> Constants.ROUND_FINISHED.equals(r.getStatus()));
            boolean hasCheckmateWinner = isFinalStage && checkmateWinnerId != null;

            if (hasCheckmateWinner) {
                // 有选手在进入该局前已达20分并在本局吃鸡，达成【20分登顶夺冠】，总决赛提前完赛！
                final String winnerId = checkmateWinnerId;
                List<StagePlayerState> others = states.stream()
                        .filter(s -> !s.getPlayerId().equals(winnerId))
                        .sorted((a, b) -> {
                            if (!b.getTotalScore().equals(a.getTotalScore())) return b.getTotalScore().compareTo(a.getTotalScore());
                            if (!b.getFirstPlaceCount().equals(a.getFirstPlaceCount())) return b.getFirstPlaceCount().compareTo(a.getFirstPlaceCount());
                            if (!b.getTop4Count().equals(a.getTop4Count())) return b.getTop4Count().compareTo(a.getTop4Count());
                            return a.getPlayerId().compareTo(b.getPlayerId());
                        })
                        .toList();

                for (StagePlayerState s : states) {
                    if (s.getPlayerId().equals(winnerId)) {
                        s.setFinalRank(1);
                        s.setAdvancementStatus(Constants.ADVANCE_CHAMPION);
                    } else {
                        int rankIdx = others.indexOf(s);
                        s.setFinalRank(rankIdx + 2);
                        s.setAdvancementStatus(Constants.ADVANCE_NONE);
                    }
                    stagePlayerStateMapper.updateById(s);
                }

                // 登顶夺冠：总决赛赛段立即锁定完赛，赛事状态立即转为 COMPLETED
                stage.setStatus(Constants.STAGE_LOCKED);
                stageMapper.updateById(stage);

                Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
                if (tournament != null) {
                    tournament.setStatus(Constants.TOURNAMENT_COMPLETED);
                    tournamentMapper.updateById(tournament);
                    sseEmitterManager.broadcast(tournament.getShareCode(), "STAGE_LOCKED", Map.of("stageId", stage.getId()));
                }
            } else if (allRoundsFinished) {
                // 所有小局全部打完（若为决赛打满8局仍无人达成20分+吃鸡，按总积分最高者夺冠）
                states.sort((a, b) -> {
                    if (!b.getTotalScore().equals(a.getTotalScore())) return b.getTotalScore().compareTo(a.getTotalScore());
                    if (!b.getFirstPlaceCount().equals(a.getFirstPlaceCount())) return b.getFirstPlaceCount().compareTo(a.getFirstPlaceCount());
                    if (!b.getTop4Count().equals(a.getTop4Count())) return b.getTop4Count().compareTo(a.getTop4Count());
                    return a.getPlayerId().compareTo(b.getPlayerId());
                });

                int totalCount = states.size();
                int directCount = stage.getDirectToFinalCount() != null ? stage.getDirectToFinalCount() : 0;
                int elimCount = stage.getEliminateCount() != null ? stage.getEliminateCount() : 0;
                int advanceCount = totalCount - directCount - elimCount;

                boolean allNone = states.stream().allMatch(s -> s.getAdvancementStatus() == null || Constants.ADVANCE_NONE.equals(s.getAdvancementStatus()));

                for (int i = 0; i < totalCount; i++) {
                    StagePlayerState s = states.get(i);
                    s.setFinalRank(i + 1);
                    if (allNone) {
                        if (isFinalStage) {
                            if (i == 0) {
                                s.setAdvancementStatus(Constants.ADVANCE_CHAMPION);
                            } else {
                                s.setAdvancementStatus(Constants.ADVANCE_NONE);
                            }
                        } else {
                            if (i < directCount) {
                                s.setAdvancementStatus(Constants.ADVANCE_DIRECT_FINAL);
                            } else if (i < directCount + advanceCount) {
                                s.setAdvancementStatus(Constants.ADVANCE_QUALIFIED);
                            } else {
                                s.setAdvancementStatus(Constants.ADVANCE_ELIMINATED);
                            }
                        }
                    }
                    stagePlayerStateMapper.updateById(s);
                }

                if (isFinalStage) {
                    // 决赛打满所有轮次：总决赛赛段立即锁定完赛，赛事状态立即转为 COMPLETED
                    stage.setStatus(Constants.STAGE_LOCKED);
                    stageMapper.updateById(stage);

                    Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
                    if (tournament != null) {
                        tournament.setStatus(Constants.TOURNAMENT_COMPLETED);
                        tournamentMapper.updateById(tournament);
                        sseEmitterManager.broadcast(tournament.getShareCode(), "STAGE_LOCKED", Map.of("stageId", stage.getId()));
                    }
                }
            } else {
                // 尚在比赛中且未决出登顶冠军：按实时得分展示临时排名，晋级状态为 NONE
                states.sort((a, b) -> {
                    if (!b.getTotalScore().equals(a.getTotalScore())) return b.getTotalScore().compareTo(a.getTotalScore());
                    if (!b.getFirstPlaceCount().equals(a.getFirstPlaceCount())) return b.getFirstPlaceCount().compareTo(a.getFirstPlaceCount());
                    if (!b.getTop4Count().equals(a.getTop4Count())) return b.getTop4Count().compareTo(a.getTop4Count());
                    return a.getPlayerId().compareTo(b.getPlayerId());
                });

                for (int i = 0; i < states.size(); i++) {
                    StagePlayerState s = states.get(i);
                    s.setAdvancementStatus(Constants.ADVANCE_NONE);
                    s.setFinalRank(i + 1);
                    stagePlayerStateMapper.updateById(s);
                }
            }
        }
    }

    private Map<String, Integer> getScoreMapping(String scoreRuleId) {
        if (scoreRuleId != null) {
            ScoreRule rule = scoreRuleMapper.selectById(scoreRuleId);
            if (rule != null && rule.getScoreMapping() != null) {
                try {
                    return objectMapper.readValue(rule.getScoreMapping(), new TypeReference<Map<String, Integer>>() {});
                } catch (Exception ignored) {}
            }
        }
        // 默认映射
        Map<String, Integer> map = new HashMap<>();
        map.put("1", 8);
        map.put("2", 7);
        map.put("3", 6);
        map.put("4", 5);
        map.put("5", 4);
        map.put("6", 3);
        map.put("7", 2);
        map.put("8", 1);
        return map;
    }
}
