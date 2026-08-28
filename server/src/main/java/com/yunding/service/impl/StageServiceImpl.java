package com.yunding.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yunding.common.BizException;
import com.yunding.common.Constants;
import com.yunding.config.SseEmitterManager;
import com.yunding.dto.PlayerBatchImportDTO;
import com.yunding.entity.*;
import com.yunding.mapper.*;
import com.yunding.service.StageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StageServiceImpl implements StageService {

    private final PlayerMapper playerMapper;
    private final StageMapper stageMapper;
    private final TournamentMapper tournamentMapper;
    private final StageGroupMapper stageGroupMapper;
    private final StageGroupPlayerMapper stageGroupPlayerMapper;
    private final MatchRoundMapper matchRoundMapper;
    private final GameRecordMapper gameRecordMapper;
    private final StagePlayerStateMapper stagePlayerStateMapper;
    private final SseEmitterManager sseEmitterManager;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void importPlayers(PlayerBatchImportDTO dto) {
        Tournament tournament = tournamentMapper.selectById(dto.getTournamentId());
        if (tournament == null || tournament.getIsDeleted() == 1) {
            throw new BizException("赛事不存在");
        }

        // 核心安全校验：检查比赛是否已开赛（已生成分组、进入进行中或已产生比分）
        if (!Constants.TOURNAMENT_DRAFT.equals(tournament.getStatus())) {
            throw new BizException("赛事已处于进行中或完赛状态，严禁批量重新导入名册！如需修改选手姓名或游戏ID，请使用单选手信息修改功能。");
        }

        List<Stage> stages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournament.getId())
                .eq(Stage::getIsDeleted, 0)
                .orderByAsc(Stage::getStageOrder));

        for (Stage s : stages) {
            if (!Constants.STAGE_PENDING.equals(s.getStatus())) {
                throw new BizException("赛段已生成分组或已锁定，严禁批量重新导入名册！如需修改选手姓名或游戏ID，请使用单选手信息修改功能。");
            }
        }

        if (dto.getPlayers() == null || dto.getPlayers().size() != tournament.getTotalPlayers()) {
            throw new BizException(String.format("选手录入数量必须恰好等于赛事设定总人数 (%d人)", tournament.getTotalPlayers()));
        }

        // 删除旧名册
        playerMapper.delete(new LambdaQueryWrapper<Player>().eq(Player::getTournamentId, tournament.getId()));

        // 插入选手名册
        List<Player> playerList = new ArrayList<>();
        for (int i = 0; i < dto.getPlayers().size(); i++) {
            PlayerBatchImportDTO.PlayerItem item = dto.getPlayers().get(i);
            Player p = new Player();
            p.setTournamentId(tournament.getId());
            p.setName(item.getName());
            p.setGameId(item.getGameId());
            p.setAvatarUrl(item.getAvatarUrl());
            p.setInitialSeed(item.getInitialSeed() != null ? item.getInitialSeed() : (i + 1));
            p.setCreatedAt(new Date());
            playerMapper.insert(p);
            playerList.add(p);
        }

        // 第一赛段自动填充初始选手状态
        if (!stages.isEmpty()) {
            Stage firstStage = stages.get(0);
            stagePlayerStateMapper.delete(new LambdaQueryWrapper<StagePlayerState>()
                    .eq(StagePlayerState::getStageId, firstStage.getId()));

            for (Player p : playerList) {
                StagePlayerState state = new StagePlayerState();
                state.setStageId(firstStage.getId());
                state.setPlayerId(p.getId());
                state.setCarryOverScore(0);
                state.setStageScore(0);
                state.setTotalScore(0);
                state.setFirstPlaceCount(0);
                state.setTop4Count(0);
                state.setAdvancementStatus(Constants.ADVANCE_NONE);
                state.setIsMatchPoint(0);
                stagePlayerStateMapper.insert(state);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Player updatePlayer(String playerId, String name, String gameId, String avatarUrl) {
        Player p = playerMapper.selectById(playerId);
        if (p == null) {
            throw new BizException("选手不存在");
        }
        if (name != null && !name.trim().isEmpty()) {
            p.setName(name.trim());
        }
        if (gameId != null) {
            p.setGameId(gameId.trim());
        }
        if (avatarUrl != null) {
            p.setAvatarUrl(avatarUrl.trim());
        }
        playerMapper.updateById(p);

        // 获取赛事 shareCode 进行 SSE 广播通知
        Tournament t = tournamentMapper.selectById(p.getTournamentId());
        if (t != null) {
            sseEmitterManager.broadcast(t.getShareCode(), "PLAYER_UPDATED", p);
        }

        return p;
    }

    @Override
    public List<Player> listPlayers(String tournamentId) {
        return playerMapper.selectList(new LambdaQueryWrapper<Player>()
                .eq(Player::getTournamentId, tournamentId)
                .orderByAsc(Player::getInitialSeed));
    }

    @Override
    public Map<String, Object> getStageDetail(String stageId) {
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }

        List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stageId)
                .orderByAsc(StageGroup::getGroupOrder));

        List<Map<String, Object>> groupDetails = new ArrayList<>();
        for (StageGroup g : groups) {
            Map<String, Object> gMap = new HashMap<>();
            gMap.put("group", g);

            List<StageGroupPlayer> groupPlayers = stageGroupPlayerMapper.selectList(new LambdaQueryWrapper<StageGroupPlayer>()
                    .eq(StageGroupPlayer::getStageGroupId, g.getId())
                    .orderByAsc(StageGroupPlayer::getSeedIndex));

            List<Map<String, Object>> players = new ArrayList<>();
            for (StageGroupPlayer gp : groupPlayers) {
                Player p = playerMapper.selectById(gp.getPlayerId());
                Map<String, Object> pMap = new HashMap<>();
                pMap.put("player", p);
                pMap.put("seedIndex", gp.getSeedIndex());
                players.add(pMap);
            }
            gMap.put("players", players);

            List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                    .eq(MatchRound::getStageGroupId, g.getId())
                    .orderByAsc(MatchRound::getRoundNumber));
            gMap.put("rounds", rounds);

            groupDetails.add(gMap);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("stage", stage);
        result.put("groups", groupDetails);
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void executeGrouping(String stageId, String mode) {
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }

        if (Constants.STAGE_LOCKED.equals(stage.getStatus())) {
            throw new BizException("已锁定的赛段不能重新分组");
        }

        // 安全校验：检查当前赛段是否已有对局录入了成绩（必须积分为0未开赛）
        List<StageGroup> existingGroups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stageId));
        if (!existingGroups.isEmpty()) {
            List<String> groupIds = existingGroups.stream().map(StageGroup::getId).collect(Collectors.toList());
            List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                    .in(MatchRound::getStageGroupId, groupIds));
            if (!rounds.isEmpty()) {
                List<String> roundIds = rounds.stream().map(MatchRound::getId).collect(Collectors.toList());
                Long recordCount = gameRecordMapper.selectCount(new LambdaQueryWrapper<GameRecord>()
                        .in(GameRecord::getMatchRoundId, roundIds));
                if (recordCount > 0) {
                    throw new BizException("当前赛段已有对局打完并录入了成绩，严禁重新分组！如需重设，请先作废相关对局成绩。");
                }
            }
        }

        // 获取本赛段参赛选手
        List<StagePlayerState> states = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                .eq(StagePlayerState::getStageId, stageId));

        if (states.isEmpty() || states.size() % 8 != 0) {
            throw new BizException(String.format("本赛段选手人数(%d人)不是8的倍数，请检查上一赛段流转", states.size()));
        }

        int totalCount = states.size();
        int groupCount = totalCount / 8;

        // 获取选手列表并排序（按初始种子或当前积分/名次）
        List<String> playerIds = new ArrayList<>();
        if ("SNAKE".equalsIgnoreCase(mode)) {
            // 蛇形分组排序依据：按 totalScore DESC, firstPlaceCount DESC, top4Count DESC, playerId ASC
            states.sort((a, b) -> {
                if (!b.getTotalScore().equals(a.getTotalScore())) return b.getTotalScore().compareTo(a.getTotalScore());
                if (!b.getFirstPlaceCount().equals(a.getFirstPlaceCount())) return b.getFirstPlaceCount().compareTo(a.getFirstPlaceCount());
                if (!b.getTop4Count().equals(a.getTop4Count())) return b.getTop4Count().compareTo(a.getTop4Count());
                return a.getPlayerId().compareTo(b.getPlayerId());
            });
            playerIds = states.stream().map(StagePlayerState::getPlayerId).collect(Collectors.toList());
        } else {
            // 随机打散
            playerIds = states.stream().map(StagePlayerState::getPlayerId).collect(Collectors.toList());
            Collections.shuffle(playerIds);
        }

        // 清理当前赛段旧分组与旧对局
        List<StageGroup> oldGroups = existingGroups;
        for (StageGroup g : oldGroups) {
            matchRoundMapper.delete(new LambdaQueryWrapper<MatchRound>().eq(MatchRound::getStageGroupId, g.getId()));
            stageGroupPlayerMapper.delete(new LambdaQueryWrapper<StageGroupPlayer>().eq(StageGroupPlayer::getStageGroupId, g.getId()));
            stageGroupMapper.deleteById(g.getId());
        }

        // 分组容器：groupCount 个列表
        List<List<String>> groupBuckets = new ArrayList<>();
        for (int i = 0; i < groupCount; i++) {
            groupBuckets.add(new ArrayList<>());
        }

        if ("SNAKE".equalsIgnoreCase(mode)) {
            // 蛇形分配
            for (int rank = 0; rank < totalCount; rank++) {
                int round = rank / groupCount;
                int rem = rank % groupCount;
                int targetGroup = (round % 2 == 0) ? rem : (groupCount - 1 - rem);
                groupBuckets.get(targetGroup).add(playerIds.get(rank));
            }
        } else {
            // 顺序等分
            for (int i = 0; i < totalCount; i++) {
                int targetGroup = i / 8;
                groupBuckets.get(targetGroup).add(playerIds.get(i));
            }
        }

        // 保存分组数据到数据库
        String[] groupNames = {"A组", "B组", "C组", "D组", "E组", "F组", "G组", "H组", "I组", "J组", "K组", "L组", "M组", "N组", "O组", "P组"};
        for (int gIdx = 0; gIdx < groupCount; gIdx++) {
            StageGroup group = new StageGroup();
            group.setStageId(stageId);
            group.setGroupName(gIdx < groupNames.length ? groupNames[gIdx] : ("第" + (gIdx + 1) + "组"));
            group.setGroupOrder(gIdx + 1);
            group.setCreatedAt(new Date());
            stageGroupMapper.insert(group);

            List<String> gPlayers = groupBuckets.get(gIdx);
            for (int pIdx = 0; pIdx < gPlayers.size(); pIdx++) {
                StageGroupPlayer gp = new StageGroupPlayer();
                gp.setStageGroupId(group.getId());
                gp.setPlayerId(gPlayers.get(pIdx));
                gp.setSeedIndex(pIdx + 1);
                stageGroupPlayerMapper.insert(gp);
            }

            // 为该组生成全部小局对局房 (R1 ~ R_roundCount)
            for (int r = 1; r <= stage.getRoundCount(); r++) {
                MatchRound mr = new MatchRound();
                mr.setStageGroupId(group.getId());
                mr.setRoundNumber(r);
                mr.setStatus(Constants.ROUND_PENDING);
                mr.setCreatedAt(new Date());
                matchRoundMapper.insert(mr);
            }
        }

        stage.setStatus(Constants.STAGE_GROUPED);
        stageMapper.updateById(stage);

        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        if (Constants.TOURNAMENT_DRAFT.equals(tournament.getStatus())) {
            tournament.setStatus(Constants.TOURNAMENT_IN_PROGRESS);
            tournamentMapper.updateById(tournament);
        }

        sseEmitterManager.broadcast(tournament.getShareCode(), "STAGE_GROUPED", Map.of("stageId", stageId));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void swapPlayers(String stageId, String player1Id, String player2Id) {
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }

        if (Constants.STAGE_LOCKED.equals(stage.getStatus())) {
            throw new BizException("已锁定的赛段不能微调换人");
        }

        if (player1Id.equals(player2Id)) {
            throw new BizException("互换的两位选手不能为同一人");
        }

        // 检查本赛段是否已有单局录入比分（必须满足积分为0未开赛）
        List<StageGroup> existingGroups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stageId));
        if (existingGroups.isEmpty()) {
            throw new BizException("当前赛段尚未执行分组，无法微调换人");
        }

        List<String> groupIds = existingGroups.stream().map(StageGroup::getId).collect(Collectors.toList());
        List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                .in(MatchRound::getStageGroupId, groupIds));
        if (!rounds.isEmpty()) {
            List<String> roundIds = rounds.stream().map(MatchRound::getId).collect(Collectors.toList());
            Long recordCount = gameRecordMapper.selectCount(new LambdaQueryWrapper<GameRecord>()
                    .in(GameRecord::getMatchRoundId, roundIds));
            if (recordCount > 0) {
                throw new BizException("当前赛段已有对局打完并产生积分，严禁微调互换选手！");
            }
        }

        // 查询两位选手在当前赛段的分组记录
        StageGroupPlayer sgp1 = stageGroupPlayerMapper.selectOne(new LambdaQueryWrapper<StageGroupPlayer>()
                .in(StageGroupPlayer::getStageGroupId, groupIds)
                .eq(StageGroupPlayer::getPlayerId, player1Id));
        StageGroupPlayer sgp2 = stageGroupPlayerMapper.selectOne(new LambdaQueryWrapper<StageGroupPlayer>()
                .in(StageGroupPlayer::getStageGroupId, groupIds)
                .eq(StageGroupPlayer::getPlayerId, player2Id));

        if (sgp1 == null || sgp2 == null) {
            throw new BizException("选中的选手未在当前赛段的分组名单中");
        }

        // 互换 stageGroupId 与 seedIndex
        String tempGroupId = sgp1.getStageGroupId();
        Integer tempSeed = sgp1.getSeedIndex();

        sgp1.setStageGroupId(sgp2.getStageGroupId());
        sgp1.setSeedIndex(sgp2.getSeedIndex());

        sgp2.setStageGroupId(tempGroupId);
        sgp2.setSeedIndex(tempSeed);

        stageGroupPlayerMapper.updateById(sgp1);
        stageGroupPlayerMapper.updateById(sgp2);

        // 广播 SSE 实时推流
        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        if (tournament != null) {
            sseEmitterManager.broadcast(tournament.getShareCode(), "STAGE_GROUPED", Map.of("stageId", stageId));
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void lockStage(String stageId) {
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }

        // 校验是否所有组的所有小局均已完赛并录入比分
        List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stageId));
        if (groups.isEmpty()) {
            throw new BizException("赛段尚未分组开赛");
        }

        for (StageGroup g : groups) {
            List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                    .eq(MatchRound::getStageGroupId, g.getId()));
            for (MatchRound r : rounds) {
                if (!Constants.ROUND_FINISHED.equals(r.getStatus())) {
                    throw new BizException(String.format("[%s] 第 %d 局尚未完赛录入成绩，无法锁定赛段", g.getGroupName(), r.getRoundNumber()));
                }
            }
        }

        // 计算本赛段选手排名
        List<StagePlayerState> states = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                .eq(StagePlayerState::getStageId, stageId));

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

        // 标记晋级/直通/淘汰状态
        for (int i = 0; i < totalCount; i++) {
            StagePlayerState s = states.get(i);
            s.setFinalRank(i + 1);

            if ("CHECKPOINT_FINAL".equalsIgnoreCase(stage.getStageType())) {
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
            stagePlayerStateMapper.updateById(s);
        }

        stage.setStatus(Constants.STAGE_LOCKED);
        stageMapper.updateById(stage);

        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());

        // 自动将晋级选手导入下一赛段
        List<Stage> allStages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournament.getId())
                .eq(Stage::getIsDeleted, 0)
                .orderByAsc(Stage::getStageOrder));

        int currentIndex = -1;
        for (int i = 0; i < allStages.size(); i++) {
            if (allStages.get(i).getId().equals(stageId)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex < allStages.size() - 1) {
            Stage nextStage = allStages.get(currentIndex + 1);
            boolean isNextFinal = (currentIndex + 1 == allStages.size() - 1);

            // 清理下一阶段旧状态
            stagePlayerStateMapper.delete(new LambdaQueryWrapper<StagePlayerState>()
                    .eq(StagePlayerState::getStageId, nextStage.getId()));

            if (isNextFinal) {
                // 下一赛段是决赛：收集所有前面赛段直通的选手 + 本赛段常规晋级选手（共8人）
                List<String> finalPlayerIds = new ArrayList<>();
                
                // 1. 查找历史所有直通选手
                for (int i = 0; i <= currentIndex; i++) {
                    Stage prevStage = allStages.get(i);
                    List<StagePlayerState> directs = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                            .eq(StagePlayerState::getStageId, prevStage.getId())
                            .eq(StagePlayerState::getAdvancementStatus, Constants.ADVANCE_DIRECT_FINAL));
                    for (StagePlayerState d : directs) {
                        finalPlayerIds.add(d.getPlayerId());
                    }
                }

                // 2. 本赛段常规晋级选手
                for (int i = directCount; i < directCount + advanceCount; i++) {
                    finalPlayerIds.add(states.get(i).getPlayerId());
                }

                for (String pid : finalPlayerIds) {
                    StagePlayerState nextState = new StagePlayerState();
                    nextState.setStageId(nextStage.getId());
                    nextState.setPlayerId(pid);
                    nextState.setCarryOverScore(0);
                    nextState.setStageScore(0);
                    nextState.setTotalScore(0);
                    nextState.setFirstPlaceCount(0);
                    nextState.setTop4Count(0);
                    nextState.setAdvancementStatus(Constants.ADVANCE_NONE);
                    nextState.setIsMatchPoint(0);
                    stagePlayerStateMapper.insert(nextState);
                }
            } else {
                // 下一赛段是常规赛段：导入本赛段常规晋级选手
                boolean inherit = nextStage.getInheritScores() != null && nextStage.getInheritScores() == 1;
                for (int i = directCount; i < directCount + advanceCount; i++) {
                    StagePlayerState prev = states.get(i);
                    StagePlayerState nextState = new StagePlayerState();
                    nextState.setStageId(nextStage.getId());
                    nextState.setPlayerId(prev.getPlayerId());
                    int carryScore = inherit ? prev.getTotalScore() : 0;
                    nextState.setCarryOverScore(carryScore);
                    nextState.setStageScore(0);
                    nextState.setTotalScore(carryScore);
                    nextState.setFirstPlaceCount(0);
                    nextState.setTop4Count(0);
                    nextState.setAdvancementStatus(Constants.ADVANCE_NONE);
                    nextState.setIsMatchPoint(0);
                    stagePlayerStateMapper.insert(nextState);
                }
            }

            tournament.setCurrentStageId(nextStage.getId());
            tournamentMapper.updateById(tournament);
        } else {
            // 决赛完赛
            tournament.setStatus(Constants.TOURNAMENT_COMPLETED);
            tournamentMapper.updateById(tournament);
        }

        sseEmitterManager.broadcast(tournament.getShareCode(), "STAGE_LOCKED", Map.of("stageId", stageId));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void clearGrouping(String stageId) {
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }

        if (Constants.STAGE_LOCKED.equals(stage.getStatus())) {
            throw new BizException("已锁定的赛段不能清除分组，请先解锁赛段");
        }

        // 检查当前赛段是否已有单局打完录入了成绩
        List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stageId));
        if (!groups.isEmpty()) {
            List<String> groupIds = groups.stream().map(StageGroup::getId).collect(Collectors.toList());
            List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                    .in(MatchRound::getStageGroupId, groupIds));
            if (!rounds.isEmpty()) {
                List<String> roundIds = rounds.stream().map(MatchRound::getId).collect(Collectors.toList());
                Long recordCount = gameRecordMapper.selectCount(new LambdaQueryWrapper<GameRecord>()
                        .in(GameRecord::getMatchRoundId, roundIds));
                if (recordCount > 0) {
                    throw new BizException("当前赛段已有对局录入了成绩（选手已有得分），严禁清除分组！如需重设，请先作废相关对局成绩。");
                }
            }

            // 清除对局房、席位关联与分组
            for (StageGroup g : groups) {
                matchRoundMapper.delete(new LambdaQueryWrapper<MatchRound>().eq(MatchRound::getStageGroupId, g.getId()));
                stageGroupPlayerMapper.delete(new LambdaQueryWrapper<StageGroupPlayer>().eq(StageGroupPlayer::getStageGroupId, g.getId()));
                stageGroupMapper.deleteById(g.getId());
            }
        }

        stage.setStatus(Constants.STAGE_PENDING);
        stageMapper.updateById(stage);

        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        if (tournament != null) {
            sseEmitterManager.broadcast(tournament.getShareCode(), "STAGE_GROUPED", Map.of("stageId", stageId));
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unlockStage(String stageId) {
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }

        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        List<Stage> allStages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournament.getId())
                .eq(Stage::getIsDeleted, 0)
                .orderByAsc(Stage::getStageOrder));

        int currentIndex = -1;
        for (int i = 0; i < allStages.size(); i++) {
            if (allStages.get(i).getId().equals(stageId)) {
                currentIndex = i;
                break;
            }
        }

        // 核心安全校验：解锁当前赛段，必须满足下一赛段（及所有下游赛段）无任何分组信息以及积分信息
        if (currentIndex < allStages.size() - 1) {
            for (int j = currentIndex + 1; j < allStages.size(); j++) {
                Stage downstream = allStages.get(j);
                // 1. 校验下游赛段是否有分组
                Long groupCount = stageGroupMapper.selectCount(new LambdaQueryWrapper<StageGroup>()
                        .eq(StageGroup::getStageId, downstream.getId()));
                if (groupCount > 0 || !Constants.STAGE_PENDING.equals(downstream.getStatus())) {
                    throw new BizException(String.format("下一赛段 [%s] 已存在分组信息或对局，严禁直接解锁当前赛段！请先清除下一赛段的分组。", downstream.getName()));
                }

                // 2. 校验下游赛段是否有任何小局或战报成绩
                List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                        .eq(StageGroup::getStageId, downstream.getId()));
                if (!groups.isEmpty()) {
                    List<String> groupIds = groups.stream().map(StageGroup::getId).collect(Collectors.toList());
                    List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                            .in(MatchRound::getStageGroupId, groupIds));
                    if (!rounds.isEmpty()) {
                        List<String> roundIds = rounds.stream().map(MatchRound::getId).collect(Collectors.toList());
                        Long recordCount = gameRecordMapper.selectCount(new LambdaQueryWrapper<GameRecord>()
                                .in(GameRecord::getMatchRoundId, roundIds));
                        if (recordCount > 0) {
                            throw new BizException(String.format("下一赛段 [%s] 已产生对局成绩，严禁解锁当前赛段！", downstream.getName()));
                        }
                    }
                }
            }

            // 清理下游晋级选手的流转状态记录 (stage_player_state)
            for (int j = currentIndex + 1; j < allStages.size(); j++) {
                Stage downstream = allStages.get(j);
                stagePlayerStateMapper.delete(new LambdaQueryWrapper<StagePlayerState>()
                        .eq(StagePlayerState::getStageId, downstream.getId()));
            }
        }

        // 检查当前赛段是否有分组记录以决定解锁后的状态
        Long currentGroupsCount = stageGroupMapper.selectCount(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stage.getId()));
        stage.setStatus(currentGroupsCount > 0 ? Constants.STAGE_GROUPED : Constants.STAGE_PENDING);
        stageMapper.updateById(stage);

        tournament.setCurrentStageId(stage.getId());
        tournament.setStatus(Constants.TOURNAMENT_IN_PROGRESS);
        tournamentMapper.updateById(tournament);

        sseEmitterManager.broadcast(tournament.getShareCode(), "STAGE_UNLOCKED", Map.of("stageId", stageId));
    }
}
