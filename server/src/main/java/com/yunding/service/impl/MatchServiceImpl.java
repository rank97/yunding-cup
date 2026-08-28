package com.yunding.service.impl;

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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submitRoundRecord(String matchRoundId, RoundRecordSubmitDTO dto) {
        MatchRound round = matchRoundMapper.selectById(matchRoundId);
        if (round == null) {
            throw new BizException("对局不存在");
        }

        StageGroup group = stageGroupMapper.selectById(round.getStageGroupId());
        Stage stage = stageMapper.selectById(group.getStageId());
        if (Constants.STAGE_LOCKED.equals(stage.getStatus())) {
            throw new BizException("当前赛段已锁定，严禁修改成绩");
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
        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
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
        MatchRound round = matchRoundMapper.selectById(matchRoundId);
        if (round == null) {
            throw new BizException("对局不存在");
        }

        StageGroup group = stageGroupMapper.selectById(round.getStageGroupId());
        Stage stage = stageMapper.selectById(group.getStageId());
        if (Constants.STAGE_LOCKED.equals(stage.getStatus())) {
            throw new BizException("当前赛段已锁定，严禁重置成绩");
        }

        gameRecordMapper.delete(new LambdaQueryWrapper<GameRecord>().eq(GameRecord::getMatchRoundId, matchRoundId));
        round.setStatus(Constants.ROUND_PENDING);
        matchRoundMapper.updateById(round);

        recalculateStageScores(stage);

        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        sseEmitterManager.broadcast(tournament.getShareCode(), "ROUND_RESET", Map.of(
                "stageId", stage.getId(),
                "matchRoundId", matchRoundId
        ));
    }

    private void recalculateStageScores(Stage stage) {
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

            state.setStageScore(stageScore);
            int totalScore = (state.getCarryOverScore() != null ? state.getCarryOverScore() : 0) + stageScore;
            state.setTotalScore(totalScore);
            state.setFirstPlaceCount(firstPlaces);
            state.setTop4Count(top4s);

            // 决赛 20 分赛点判定
            if (isFinalStage) {
                state.setIsMatchPoint(totalScore >= 20 ? 1 : 0);
            }

            stagePlayerStateMapper.updateById(state);
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
