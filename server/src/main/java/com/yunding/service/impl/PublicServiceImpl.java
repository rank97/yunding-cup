package com.yunding.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yunding.common.BizException;
import com.yunding.common.Constants;
import com.yunding.config.SseEmitterManager;
import com.yunding.entity.*;
import com.yunding.mapper.*;
import com.yunding.service.PublicService;
import com.yunding.vo.GroupDetailsVO;
import com.yunding.vo.StageLeaderboardVO;
import com.yunding.vo.TournamentOverviewVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicServiceImpl implements PublicService {

    private final TournamentMapper tournamentMapper;
    private final StageMapper stageMapper;
    private final PlayerMapper playerMapper;
    private final StagePlayerStateMapper stagePlayerStateMapper;
    private final StageGroupMapper stageGroupMapper;
    private final StageGroupPlayerMapper stageGroupPlayerMapper;
    private final MatchRoundMapper matchRoundMapper;
    private final GameRecordMapper gameRecordMapper;
    private final ScoreRuleMapper scoreRuleMapper;
    private final SseEmitterManager sseEmitterManager;

    @Override
    public List<Tournament> listPublicTournaments() {
        return tournamentMapper.selectList(new LambdaQueryWrapper<Tournament>()
                .eq(Tournament::getIsDeleted, 0)
                .orderByDesc(Tournament::getCreatedAt));
    }

    @Override
    public List<ScoreRule> listScoreRules() {
        return scoreRuleMapper.selectList(new LambdaQueryWrapper<ScoreRule>()
                .orderByAsc(ScoreRule::getId));
    }

    @Override
    public TournamentOverviewVO getTournamentOverview(String shareCode) {
        Tournament tournament = tournamentMapper.selectOne(new LambdaQueryWrapper<Tournament>()
                .eq(Tournament::getShareCode, shareCode)
                .eq(Tournament::getIsDeleted, 0));
        if (tournament == null) {
            throw new BizException("赛事不存在或已被删除");
        }

        List<Stage> stages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournament.getId())
                .eq(Stage::getIsDeleted, 0)
                .orderByAsc(Stage::getStageOrder));

        TournamentOverviewVO vo = new TournamentOverviewVO();
        vo.setId(tournament.getId());
        vo.setTitle(tournament.getTitle());
        vo.setTotalPlayers(tournament.getTotalPlayers());
        vo.setShareCode(tournament.getShareCode());
        vo.setStatus(tournament.getStatus());
        vo.setCurrentStageId(tournament.getCurrentStageId());

        Stage currStage = stageMapper.selectById(tournament.getCurrentStageId());
        vo.setCurrentStageName(currStage != null ? currStage.getName() : "");

        List<TournamentOverviewVO.StageColumnVO> columns = new ArrayList<>();
        List<String> matchPointCandidateNames = new ArrayList<>();
        Map<String, String> scoreRuleMap = scoreRuleMapper.selectList(null).stream()
                .collect(Collectors.toMap(ScoreRule::getId, ScoreRule::getRuleName, (k1, k2) -> k1));

        for (int i = 0; i < stages.size(); i++) {
            Stage stage = stages.get(i);
            TournamentOverviewVO.StageColumnVO col = new TournamentOverviewVO.StageColumnVO();
            col.setStageId(stage.getId());
            col.setName(stage.getName());
            col.setStageOrder(stage.getStageOrder());
            col.setStageType(stage.getStageType());
            col.setRoundCount(stage.getRoundCount());
            col.setDirectToFinalCount(stage.getDirectToFinalCount());
            col.setEliminateCount(stage.getEliminateCount());
            col.setInheritScores(stage.getInheritScores());
            col.setScoreRuleId(stage.getScoreRuleId() != null ? stage.getScoreRuleId() : "1");
            col.setScoreRuleName(scoreRuleMap.getOrDefault(stage.getScoreRuleId(), "官方标准积分规则 (8-7-6-5-4-3-2-1)"));
            col.setStatus(stage.getStatus());

            List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                    .eq(StageGroup::getStageId, stage.getId())
                    .orderByAsc(StageGroup::getGroupOrder));

            List<TournamentOverviewVO.GroupNodeVO> groupNodes = new ArrayList<>();

            if (!groups.isEmpty()) {
                // 已分组：渲染真实各组与选手
                for (StageGroup g : groups) {
                    TournamentOverviewVO.GroupNodeVO gNode = new TournamentOverviewVO.GroupNodeVO();
                    gNode.setGroupId(g.getId());
                    gNode.setGroupName(g.getGroupName());

                    List<StageGroupPlayer> groupPlayers = stageGroupPlayerMapper.selectList(new LambdaQueryWrapper<StageGroupPlayer>()
                            .eq(StageGroupPlayer::getStageGroupId, g.getId())
                            .orderByAsc(StageGroupPlayer::getSeedIndex));

                    List<TournamentOverviewVO.PlayerSlotVO> slots = new ArrayList<>();
                    for (StageGroupPlayer gp : groupPlayers) {
                        Player p = playerMapper.selectById(gp.getPlayerId());
                        StagePlayerState state = stagePlayerStateMapper.selectOne(new LambdaQueryWrapper<StagePlayerState>()
                                .eq(StagePlayerState::getStageId, stage.getId())
                                .eq(StagePlayerState::getPlayerId, gp.getPlayerId()));

                        TournamentOverviewVO.PlayerSlotVO slot = new TournamentOverviewVO.PlayerSlotVO();
                        if (p != null) {
                            slot.setPlayerId(p.getId());
                            slot.setName(p.getName());
                            slot.setGameId(p.getGameId());
                            slot.setAvatarUrl(p.getAvatarUrl());
                        }
                        slot.setSeedIndex(gp.getSeedIndex());
                        slot.setIsPlaceholder(false);

                        if (state != null) {
                            slot.setCurrentScore(state.getTotalScore());
                            slot.setFirstPlaces(state.getFirstPlaceCount());
                            slot.setTop4s(state.getTop4Count());
                            slot.setIsMatchPoint(state.getIsMatchPoint());
                            slot.setAdvancementStatus(state.getAdvancementStatus());

                            if (state.getIsMatchPoint() != null && state.getIsMatchPoint() == 1 && p != null) {
                                matchPointCandidateNames.add(p.getName());
                            }
                        }
                        slots.add(slot);
                    }
                    gNode.setSlots(slots);
                    groupNodes.add(gNode);
                }
            } else {
                // 尚未分组：根据流转规则动态生成预期组与“虚位以待”
                int expectedPlayers = (i == 0) ? tournament.getTotalPlayers() : calculateExpectedInputPlayers(stages, i, tournament.getTotalPlayers());
                int expectedGroupCount = Math.max(1, expectedPlayers / 8);
                String[] groupNames = {"A组", "B组", "C组", "D组", "E组", "F组", "G组", "H组"};

                for (int gIdx = 0; gIdx < expectedGroupCount; gIdx++) {
                    TournamentOverviewVO.GroupNodeVO gNode = new TournamentOverviewVO.GroupNodeVO();
                    gNode.setGroupId("mock_" + gIdx);
                    gNode.setGroupName(gIdx < groupNames.length ? groupNames[gIdx] : ("第" + (gIdx + 1) + "组"));

                    List<TournamentOverviewVO.PlayerSlotVO> slots = new ArrayList<>();
                    for (int sIdx = 1; sIdx <= 8; sIdx++) {
                        TournamentOverviewVO.PlayerSlotVO slot = new TournamentOverviewVO.PlayerSlotVO();
                        slot.setSeedIndex(sIdx);
                        slot.setIsPlaceholder(true);
                        String prevStageName = i > 0 ? stages.get(i - 1).getName() : "选手名册";
                        slot.setPlaceholderDesc("虚位以待 (来源: " + prevStageName + ")");
                        slots.add(slot);
                    }
                    gNode.setSlots(slots);
                    groupNodes.add(gNode);
                }
            }

            col.setGroups(groupNodes);
            columns.add(col);
        }

        vo.setColumns(columns);

        // 终点：总冠军王座
        TournamentOverviewVO.ChampionThroneVO throne = new TournamentOverviewVO.ChampionThroneVO();
        throne.setMatchPointCandidateNames(matchPointCandidateNames);

        Stage finalStage = stages.get(stages.size() - 1);
        StagePlayerState championState = stagePlayerStateMapper.selectOne(new LambdaQueryWrapper<StagePlayerState>()
                .eq(StagePlayerState::getStageId, finalStage.getId())
                .eq(StagePlayerState::getAdvancementStatus, Constants.ADVANCE_CHAMPION));

        if (championState != null) {
            Player champ = playerMapper.selectById(championState.getPlayerId());
            throne.setIsDetermined(true);
            throne.setChampionPlayerId(championState.getPlayerId());
            throne.setChampionName(champ != null ? champ.getName() : "");
            throne.setChampionGameId(champ != null ? champ.getGameId() : "");
            throne.setChampionAvatarUrl(champ != null ? champ.getAvatarUrl() : "");
            throne.setTotalScore(championState.getTotalScore());
            throne.setWinningRound(finalStage.getRoundCount());
        } else {
            throne.setIsDetermined(false);
        }

        vo.setChampionThrone(throne);
        return vo;
    }

    @Override
    public StageLeaderboardVO getStageLeaderboard(String shareCode, String stageId) {
        Tournament tournament = tournamentMapper.selectOne(new LambdaQueryWrapper<Tournament>()
                .eq(Tournament::getShareCode, shareCode)
                .eq(Tournament::getIsDeleted, 0));
        if (tournament == null) {
            throw new BizException("赛事不存在");
        }

        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || !stage.getTournamentId().equals(tournament.getId())) {
            throw new BizException("赛段不存在");
        }

        StageLeaderboardVO vo = new StageLeaderboardVO();
        vo.setStageId(stage.getId());
        vo.setStageName(stage.getName());
        vo.setStageOrder(stage.getStageOrder());
        vo.setStageType(stage.getStageType());
        vo.setRoundCount(stage.getRoundCount());
        vo.setDirectToFinalCount(stage.getDirectToFinalCount());
        vo.setEliminateCount(stage.getEliminateCount());
        vo.setInheritScores(stage.getInheritScores());
        vo.setScoreRuleId(stage.getScoreRuleId() != null ? stage.getScoreRuleId() : "1");
        ScoreRule currentRule = stage.getScoreRuleId() != null ? scoreRuleMapper.selectById(stage.getScoreRuleId()) : null;
        vo.setScoreRuleName(currentRule != null ? currentRule.getRuleName() : "官方标准积分规则 (8-7-6-5-4-3-2-1)");
        vo.setStatus(stage.getStatus());

        List<StagePlayerState> states = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                .eq(StagePlayerState::getStageId, stageId));

        boolean inherit = stage.getInheritScores() != null && stage.getInheritScores() == 1;
        List<Stage> prevStages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, stage.getTournamentId())
                .lt(Stage::getStageOrder, stage.getStageOrder())
                .orderByDesc(Stage::getStageOrder));

        for (StagePlayerState s : states) {
            int carryScore = 0;
            if (inherit && !prevStages.isEmpty()) {
                for (Stage ps : prevStages) {
                    StagePlayerState prevState = stagePlayerStateMapper.selectOne(new LambdaQueryWrapper<StagePlayerState>()
                            .eq(StagePlayerState::getStageId, ps.getId())
                            .eq(StagePlayerState::getPlayerId, s.getPlayerId()));
                    if (prevState != null && prevState.getTotalScore() != null) {
                        carryScore = prevState.getTotalScore();
                        break;
                    }
                }
            }
            s.setCarryOverScore(carryScore);
            int stageScore = s.getStageScore() != null ? s.getStageScore() : 0;
            s.setTotalScore(carryScore + stageScore);
            if ("CHECKPOINT_FINAL".equalsIgnoreCase(stage.getStageType())) {
                s.setIsMatchPoint((carryScore + stageScore) >= 20 ? 1 : 0);
            }
        }

        // 排序规则: 如果是决赛且有冠军产生，冠军恒排第 1；其余按 totalScore DESC > firstPlaceCount DESC > top4Count DESC > playerId ASC
        states.sort((a, b) -> {
            if ("CHECKPOINT_FINAL".equalsIgnoreCase(stage.getStageType())) {
                boolean aChamp = Constants.ADVANCE_CHAMPION.equals(a.getAdvancementStatus());
                boolean bChamp = Constants.ADVANCE_CHAMPION.equals(b.getAdvancementStatus());
                if (aChamp && !bChamp) return -1;
                if (!aChamp && bChamp) return 1;
            }
            if (!b.getTotalScore().equals(a.getTotalScore())) return b.getTotalScore().compareTo(a.getTotalScore());
            if (!b.getFirstPlaceCount().equals(a.getFirstPlaceCount())) return b.getFirstPlaceCount().compareTo(a.getFirstPlaceCount());
            if (!b.getTop4Count().equals(a.getTop4Count())) return b.getTop4Count().compareTo(a.getTop4Count());
            return a.getPlayerId().compareTo(b.getPlayerId());
        });

        // 查找分组与局次明细
        List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stageId));
        Map<String, String> playerGroupMap = new HashMap<>();
        for (StageGroup g : groups) {
            List<StageGroupPlayer> gps = stageGroupPlayerMapper.selectList(new LambdaQueryWrapper<StageGroupPlayer>()
                    .eq(StageGroupPlayer::getStageGroupId, g.getId()));
            for (StageGroupPlayer gp : gps) {
                playerGroupMap.put(gp.getPlayerId(), g.getGroupName());
            }
        }

        // 查找各局战绩
        List<String> groupIds = groups.stream().map(StageGroup::getId).toList();
        List<MatchRound> rounds = groupIds.isEmpty() ? Collections.emptyList() : matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                .in(MatchRound::getStageGroupId, groupIds)
                .orderByAsc(MatchRound::getRoundNumber));
        Map<String, MatchRound> roundMap = rounds.stream().collect(Collectors.toMap(MatchRound::getId, r -> r));

        List<String> roundIds = rounds.stream().map(MatchRound::getId).toList();
        List<GameRecord> records = roundIds.isEmpty() ? Collections.emptyList() : gameRecordMapper.selectList(new LambdaQueryWrapper<GameRecord>()
                .in(GameRecord::getMatchRoundId, roundIds));

        // playerId -> roundNumber -> score
        Map<String, Map<Integer, Integer>> playerRoundScoreMap = new HashMap<>();
        for (GameRecord r : records) {
            MatchRound mr = roundMap.get(r.getMatchRoundId());
            if (mr != null) {
                playerRoundScoreMap.computeIfAbsent(r.getPlayerId(), k -> new HashMap<>())
                        .put(mr.getRoundNumber(), r.getScore());
            }
        }

        List<StageLeaderboardVO.LeaderboardRowVO> rows = new ArrayList<>();
        for (int i = 0; i < states.size(); i++) {
            StagePlayerState s = states.get(i);
            Player p = playerMapper.selectById(s.getPlayerId());

            StageLeaderboardVO.LeaderboardRowVO row = new StageLeaderboardVO.LeaderboardRowVO();
            row.setRank(s.getFinalRank() != null ? s.getFinalRank() : (i + 1));
            row.setPlayerId(s.getPlayerId());
            row.setName(p != null ? p.getName() : "");
            row.setGameId(p != null ? p.getGameId() : "");
            row.setAvatarUrl(p != null ? p.getAvatarUrl() : "");
            row.setGroupName(playerGroupMap.getOrDefault(s.getPlayerId(), "-"));
            row.setCarryOverScore(s.getCarryOverScore() != null ? s.getCarryOverScore() : 0);
            row.setFirstPlaceCount(s.getFirstPlaceCount() != null ? s.getFirstPlaceCount() : 0);
            row.setTop4Count(s.getTop4Count() != null ? s.getTop4Count() : 0);
            row.setStageScore(s.getStageScore() != null ? s.getStageScore() : 0);
            row.setTotalScore(s.getTotalScore() != null ? s.getTotalScore() : 0);
            row.setAdvancementStatus(s.getAdvancementStatus());
            row.setIsMatchPoint(s.getIsMatchPoint());

            // 填充 R1..Rx 分数
            List<Integer> roundScores = new ArrayList<>();
            Map<Integer, Integer> rMap = playerRoundScoreMap.getOrDefault(s.getPlayerId(), Collections.emptyMap());
            for (int r = 1; r <= stage.getRoundCount(); r++) {
                roundScores.add(rMap.getOrDefault(r, null));
            }
            row.setRoundScores(roundScores);

            rows.add(row);
        }

        vo.setRows(rows);
        return vo;
    }

    @Override
    public GroupDetailsVO getGroupDetails(String shareCode, String stageId) {
        Tournament tournament = tournamentMapper.selectOne(new LambdaQueryWrapper<Tournament>()
                .eq(Tournament::getShareCode, shareCode)
                .eq(Tournament::getIsDeleted, 0));
        if (tournament == null) {
            throw new BizException("赛事不存在");
        }

        GroupDetailsVO vo = new GroupDetailsVO();
        vo.setStageId(stageId);

        List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stageId)
                .orderByAsc(StageGroup::getGroupOrder));

        List<GroupDetailsVO.GroupRowVO> groupRows = new ArrayList<>();
        for (StageGroup g : groups) {
            GroupDetailsVO.GroupRowVO gRow = new GroupDetailsVO.GroupRowVO();
            gRow.setGroupId(g.getId());
            gRow.setGroupName(g.getGroupName());

            List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                    .eq(MatchRound::getStageGroupId, g.getId())
                    .orderByAsc(MatchRound::getRoundNumber));

            List<GroupDetailsVO.RoundCardVO> roundCards = new ArrayList<>();
            for (MatchRound r : rounds) {
                GroupDetailsVO.RoundCardVO card = new GroupDetailsVO.RoundCardVO();
                card.setMatchRoundId(r.getId());
                card.setRoundNumber(r.getRoundNumber());
                card.setStatus(r.getStatus());

                List<GameRecord> records = gameRecordMapper.selectList(new LambdaQueryWrapper<GameRecord>()
                        .eq(GameRecord::getMatchRoundId, r.getId())
                        .orderByAsc(GameRecord::getRank));

                List<GroupDetailsVO.PlayerRankItemVO> items = new ArrayList<>();
                for (GameRecord rec : records) {
                    Player p = playerMapper.selectById(rec.getPlayerId());
                    StagePlayerState state = stagePlayerStateMapper.selectOne(new LambdaQueryWrapper<StagePlayerState>()
                            .eq(StagePlayerState::getStageId, stageId)
                            .eq(StagePlayerState::getPlayerId, rec.getPlayerId()));

                    GroupDetailsVO.PlayerRankItemVO item = new GroupDetailsVO.PlayerRankItemVO();
                    item.setRank(rec.getRank());
                    item.setPlayerId(rec.getPlayerId());
                    item.setName(p != null ? p.getName() : "");
                    item.setGameId(p != null ? p.getGameId() : "");
                    item.setAvatarUrl(p != null ? p.getAvatarUrl() : "");
                    item.setScore(rec.getScore());
                    item.setIsMatchPoint(state != null && state.getIsMatchPoint() != null && state.getIsMatchPoint() == 1);
                    items.add(item);
                }
                card.setRankings(items);
                roundCards.add(card);
            }
            gRow.setRounds(roundCards);
            groupRows.add(gRow);
        }

        vo.setGroups(groupRows);
        return vo;
    }

    @Override
    public SseEmitter createSseEmitter(String shareCode) {
        return sseEmitterManager.createEmitter(shareCode);
    }

    private int calculateExpectedInputPlayers(List<Stage> stages, int stageIndex, int totalPlayers) {
        int current = totalPlayers;
        for (int i = 0; i < stageIndex; i++) {
            Stage s = stages.get(i);
            int direct = s.getDirectToFinalCount() != null ? s.getDirectToFinalCount() : 0;
            int elim = s.getEliminateCount() != null ? s.getEliminateCount() : 0;
            current = Math.max(8, current - direct - elim);
        }
        return current;
    }
}
