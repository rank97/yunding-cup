package com.yunding.service.impl;

import cn.dev33.satoken.stp.StpUtil;
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

    private void checkTournamentPermission(String tournamentId) {
        String loginId = (String) StpUtil.getLoginIdDefaultNull();
        if (loginId == null) return;
        String role = (String) StpUtil.getSession().get("role");
        if (Constants.ROLE_SUPER_ADMIN.equals(role)) return;

        Tournament tournament = tournamentMapper.selectById(tournamentId);
        if (tournament == null || tournament.getIsDeleted() == 1) {
            throw new BizException("赛事不存在");
        }
        if (!tournament.getTenantId().equals(loginId)) {
            throw new BizException("无权操作他人创建的赛事");
        }
    }

    private void checkStagePermission(String stageId) {
        String loginId = (String) StpUtil.getLoginIdDefaultNull();
        if (loginId == null) return;
        String role = (String) StpUtil.getSession().get("role");
        if (Constants.ROLE_SUPER_ADMIN.equals(role)) return;

        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }
        checkTournamentPermission(stage.getTournamentId());
    }

    private static final String[] PRESET_AVATARS = {
            "https://api.dicebear.com/7.x/avataaars/svg?seed=HappyPengu&mouth=smile&eyes=happy&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/avataaars/svg?seed=ChonccJoy&mouth=twinkle&eyes=wink&backgroundColor=ffdfbf",
            "https://api.dicebear.com/7.x/avataaars/svg?seed=StarAhri&mouth=smile&eyes=happy&backgroundColor=ffd5dc",
            "https://api.dicebear.com/7.x/avataaars/svg?seed=GoldenVictory&mouth=smile&eyes=wink&backgroundColor=c0aede",
            "https://api.dicebear.com/7.x/big-smile/svg?seed=SunnyChampion&backgroundColor=ffd5dc",
            "https://api.dicebear.com/7.x/big-smile/svg?seed=LuckyHero&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/big-smile/svg?seed=JoyfulSpark&backgroundColor=d1d4f9",
            "https://api.dicebear.com/7.x/big-smile/svg?seed=HappyGamer&backgroundColor=ffdfbf",
            "https://api.dicebear.com/7.x/fun-emoji/svg?seed=CuteDango&backgroundColor=ffd5dc",
            "https://api.dicebear.com/7.x/fun-emoji/svg?seed=CheeringHorn&backgroundColor=b6e3f4",
            "https://api.dicebear.com/7.x/fun-emoji/svg?seed=LuckyStar&backgroundColor=c0aede",
            "https://api.dicebear.com/7.x/fun-emoji/svg?seed=SweetSmile&backgroundColor=ffdfbf"
    };

    private String getAutoAvatar(String name, int index) {
        if (name != null && !name.trim().isEmpty()) {
            int hash = Math.abs(name.hashCode());
            return PRESET_AVATARS[hash % PRESET_AVATARS.length];
        }
        return PRESET_AVATARS[Math.abs(index) % PRESET_AVATARS.length];
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void importPlayers(PlayerBatchImportDTO dto) {
        checkTournamentPermission(dto.getTournamentId());
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
            String avatar = item.getAvatarUrl();
            if (avatar == null || avatar.trim().isEmpty()) {
                avatar = getAutoAvatar(item.getName(), i);
            }
            p.setAvatarUrl(avatar);
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
    public Player addPlayer(String tournamentId, String name, String gameId, String avatarUrl) {
        checkTournamentPermission(tournamentId);
        Tournament tournament = tournamentMapper.selectById(tournamentId);
        if (tournament == null || tournament.getIsDeleted() == 1) {
            throw new BizException("赛事不存在");
        }

        if (!Constants.TOURNAMENT_DRAFT.equals(tournament.getStatus())) {
            throw new BizException("赛事已开赛或已完赛，不可添加新选手！");
        }

        List<Stage> stages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, tournamentId)
                .eq(Stage::getIsDeleted, 0)
                .orderByAsc(Stage::getStageOrder));

        for (Stage s : stages) {
            if (!Constants.STAGE_PENDING.equals(s.getStatus())) {
                throw new BizException("赛段已生成分组或已开赛，不可添加新选手！");
            }
        }

        List<Player> existing = playerMapper.selectList(new LambdaQueryWrapper<Player>()
                .eq(Player::getTournamentId, tournamentId));

        if (existing.size() >= tournament.getTotalPlayers()) {
            throw new BizException(String.format("选手数量已达到赛事设定上限 (%d人)", tournament.getTotalPlayers()));
        }

        if (name == null || name.trim().isEmpty()) {
            throw new BizException("选手姓名不能为空");
        }

        String finalName = name.trim();
        String finalGameId = gameId != null ? gameId.trim() : "";

        // 校验重复
        boolean duplicate = existing.stream().anyMatch(p -> p.getName().equalsIgnoreCase(finalName)
                || (!finalGameId.isEmpty() && finalGameId.equalsIgnoreCase(p.getGameId())));
        if (duplicate) {
            throw new BizException(String.format("选手【%s】或游戏ID【%s】已存在于该赛事名册中，请勿重复添加！", finalName, finalGameId));
        }

        Player p = new Player();
        p.setTournamentId(tournamentId);
        p.setName(finalName);
        p.setGameId(finalGameId);
        String finalAvatar = avatarUrl;
        if (finalAvatar == null || finalAvatar.trim().isEmpty()) {
            finalAvatar = getAutoAvatar(finalName, existing.size());
        }
        p.setAvatarUrl(finalAvatar);
        p.setInitialSeed(existing.size() + 1);
        p.setCreatedAt(new Date());
        playerMapper.insert(p);

        // 如果第一赛段处于 PENDING 状态，自动为新选手插入 StagePlayerState
        if (!stages.isEmpty()) {
            Stage firstStage = stages.get(0);
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

        sseEmitterManager.broadcast(tournament.getShareCode(), "PLAYER_ADDED", p);
        return p;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePlayer(String playerId) {
        Player p = playerMapper.selectById(playerId);
        if (p == null) {
            throw new BizException("选手不存在");
        }
        checkTournamentPermission(p.getTournamentId());

        Tournament tournament = tournamentMapper.selectById(p.getTournamentId());
        if (tournament != null && !Constants.TOURNAMENT_DRAFT.equals(tournament.getStatus())) {
            throw new BizException("赛事已开赛或已完赛，不可删除选手！");
        }

        List<Stage> stages = stageMapper.selectList(new LambdaQueryWrapper<Stage>()
                .eq(Stage::getTournamentId, p.getTournamentId())
                .eq(Stage::getIsDeleted, 0));

        for (Stage s : stages) {
            if (!Constants.STAGE_PENDING.equals(s.getStatus())) {
                throw new BizException("赛段已生成分组或已锁定，不可删除选手！");
            }
        }

        // 删除 stage_player_states
        stagePlayerStateMapper.delete(new LambdaQueryWrapper<StagePlayerState>()
                .eq(StagePlayerState::getPlayerId, playerId));

        // 删除 players 记录
        playerMapper.deleteById(playerId);

        // 重新编号种子顺位
        List<Player> remaining = playerMapper.selectList(new LambdaQueryWrapper<Player>()
                .eq(Player::getTournamentId, p.getTournamentId())
                .orderByAsc(Player::getInitialSeed));
        for (int i = 0; i < remaining.size(); i++) {
            Player rem = remaining.get(i);
            rem.setInitialSeed(i + 1);
            playerMapper.updateById(rem);
        }

        if (tournament != null) {
            sseEmitterManager.broadcast(tournament.getShareCode(), "PLAYER_DELETED", Map.of("playerId", playerId));
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Player updatePlayer(String playerId, String name, String gameId, String avatarUrl) {
        Player p = playerMapper.selectById(playerId);
        if (p == null) {
            throw new BizException("选手不存在");
        }
        checkTournamentPermission(p.getTournamentId());
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

            List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                    .eq(MatchRound::getStageGroupId, g.getId())
                    .orderByAsc(MatchRound::getRoundNumber));
            gMap.put("rounds", rounds);

            List<String> roundIds = rounds.stream().map(MatchRound::getId).toList();
            List<GameRecord> groupRecords = roundIds.isEmpty() ? Collections.emptyList() :
                    gameRecordMapper.selectList(new LambdaQueryWrapper<GameRecord>().in(GameRecord::getMatchRoundId, roundIds));
            Set<String> playedPlayerIds = groupRecords.stream().map(GameRecord::getPlayerId).collect(Collectors.toSet());

            List<StageGroupPlayer> groupPlayers = stageGroupPlayerMapper.selectList(new LambdaQueryWrapper<StageGroupPlayer>()
                    .eq(StageGroupPlayer::getStageGroupId, g.getId())
                    .orderByAsc(StageGroupPlayer::getSeedIndex));

            List<Map<String, Object>> players = new ArrayList<>();
            for (StageGroupPlayer gp : groupPlayers) {
                Player p = playerMapper.selectById(gp.getPlayerId());
                Map<String, Object> pMap = new HashMap<>();
                pMap.put("player", p);
                pMap.put("seedIndex", gp.getSeedIndex());
                pMap.put("hasPlayed", playedPlayerIds.contains(gp.getPlayerId()));
                players.add(pMap);
            }
            gMap.put("players", players);

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
        checkStagePermission(stageId);
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
        checkStagePermission(stageId);
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }

        if (Constants.STAGE_LOCKED.equals(stage.getStatus())) {
            throw new BizException("已锁定的赛段不能微调换人");
        }

        List<StageGroup> existingGroups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stageId));
        if (existingGroups.isEmpty()) {
            throw new BizException("当前赛段尚未执行分组，无法微调换人");
        }
        if (player1Id.equals(player2Id)) {
            throw new BizException("互换的两位选手不能为同一人");
        }

        // 精准校验：只有两位选手在当前赛段均未打过任何对局（无任何单局战绩 GameRecord），才允许互换组别
        List<String> groupIds = existingGroups.stream().map(StageGroup::getId).collect(Collectors.toList());
        List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                .in(MatchRound::getStageGroupId, groupIds));
        if (!rounds.isEmpty()) {
            List<String> roundIds = rounds.stream().map(MatchRound::getId).collect(Collectors.toList());
            
            Long p1RecordCount = gameRecordMapper.selectCount(new LambdaQueryWrapper<GameRecord>()
                    .in(GameRecord::getMatchRoundId, roundIds)
                    .eq(GameRecord::getPlayerId, player1Id));
            if (p1RecordCount > 0) {
                Player p1 = playerMapper.selectById(player1Id);
                String p1Name = p1 != null ? p1.getName() : "选手1";
                throw new BizException(String.format("选手 [%s] 在当前赛段已有对局记录，无法进行微调换人！", p1Name));
            }

            Long p2RecordCount = gameRecordMapper.selectCount(new LambdaQueryWrapper<GameRecord>()
                    .in(GameRecord::getMatchRoundId, roundIds)
                    .eq(GameRecord::getPlayerId, player2Id));
            if (p2RecordCount > 0) {
                Player p2 = playerMapper.selectById(player2Id);
                String p2Name = p2 != null ? p2.getName() : "选手2";
                throw new BizException(String.format("选手 [%s] 在当前赛段已有对局记录，无法进行微调换人！", p2Name));
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
        checkStagePermission(stageId);
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

        boolean isFinal = Constants.STAGE_TYPE_CHECKPOINT_FINAL.equalsIgnoreCase(stage.getStageType());
        String checkmateWinnerId = isFinal ? findCheckmateWinnerId(stage) : null;

        // 如果不是20分登顶提前夺冠，则强校验是否全部小局打完
        if (checkmateWinnerId == null) {
            for (StageGroup g : groups) {
                List<MatchRound> rounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                        .eq(MatchRound::getStageGroupId, g.getId()));
                for (MatchRound r : rounds) {
                    if (!Constants.ROUND_FINISHED.equals(r.getStatus())) {
                        throw new BizException(String.format("[%s] 第 %d 局尚未完赛录入成绩，无法锁定赛段", g.getGroupName(), r.getRoundNumber()));
                    }
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

        // 检查当前状态分配是否满足赛段规则
        if (isFinal) {
            // 决赛必须产生且仅产生 1 名冠军
            long champCount = states.stream().filter(s -> Constants.ADVANCE_CHAMPION.equals(s.getAdvancementStatus())).count();
            if (champCount == 0) {
                states.get(0).setAdvancementStatus(Constants.ADVANCE_CHAMPION);
                stagePlayerStateMapper.updateById(states.get(0));
            }
        } else {
            boolean allNone = states.stream().allMatch(s -> s.getAdvancementStatus() == null || Constants.ADVANCE_NONE.equals(s.getAdvancementStatus()));
            if (allNone) {
                // 如果用户未手动指定过任何状态，自动按当前名次赋默认状态
                for (int i = 0; i < totalCount; i++) {
                    StagePlayerState s = states.get(i);
                    s.setFinalRank(i + 1);
                    if (i < directCount) {
                        s.setAdvancementStatus(Constants.ADVANCE_DIRECT_FINAL);
                    } else if (i < directCount + advanceCount) {
                        s.setAdvancementStatus(Constants.ADVANCE_QUALIFIED);
                    } else {
                        s.setAdvancementStatus(Constants.ADVANCE_ELIMINATED);
                    }
                    stagePlayerStateMapper.updateById(s);
                }
            } else {
                // 校验手动设置的状态是否严格满足规则设定
                long actualDirect = states.stream().filter(s -> Constants.ADVANCE_DIRECT_FINAL.equals(s.getAdvancementStatus())).count();
                long actualAdvance = states.stream().filter(s -> Constants.ADVANCE_QUALIFIED.equals(s.getAdvancementStatus())).count();
                long actualElim = states.stream().filter(s -> Constants.ADVANCE_ELIMINATED.equals(s.getAdvancementStatus())).count();
                long actualNone = states.stream().filter(s -> s.getAdvancementStatus() == null || Constants.ADVANCE_NONE.equals(s.getAdvancementStatus())).count();

                if (actualNone > 0) {
                    throw new BizException(String.format("尚有 %d 位选手的晋级状态为【待定】，请为所有选手指定 晋级 / 直通 / 淘汰 状态！", actualNone));
                }

                if (actualDirect != directCount || actualAdvance != advanceCount || actualElim != elimCount) {
                    throw new BizException(String.format("当前晋级状态人数不符合本赛段规则：\n• 直通决赛：%d 人（规则要求 %d 人）\n• 常规晋级：%d 人（规则要求 %d 人）\n• 淘汰出局：%d 人（规则要求 %d 人）\n请在积分榜调整选手状态使其完全符合规则后再锁定！",
                            actualDirect, directCount, actualAdvance, advanceCount, actualElim, elimCount));
                }

                // 更新 finalRank
                for (int i = 0; i < totalCount; i++) {
                    StagePlayerState s = states.get(i);
                    s.setFinalRank(i + 1);
                    stagePlayerStateMapper.updateById(s);
                }
            }
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
                
                // 1. 查找历史所有直通选手 (ADVANCE_DIRECT_FINAL)
                for (int i = 0; i <= currentIndex; i++) {
                    Stage prevStage = allStages.get(i);
                    List<StagePlayerState> directs = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                            .eq(StagePlayerState::getStageId, prevStage.getId())
                            .eq(StagePlayerState::getAdvancementStatus, Constants.ADVANCE_DIRECT_FINAL));
                    for (StagePlayerState d : directs) {
                        if (!finalPlayerIds.contains(d.getPlayerId())) {
                            finalPlayerIds.add(d.getPlayerId());
                        }
                    }
                }

                // 2. 本赛段常规晋级选手 (ADVANCE_QUALIFIED)
                List<StagePlayerState> qualifiedStates = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                        .eq(StagePlayerState::getStageId, stageId)
                        .eq(StagePlayerState::getAdvancementStatus, Constants.ADVANCE_QUALIFIED));
                for (StagePlayerState q : qualifiedStates) {
                    if (!finalPlayerIds.contains(q.getPlayerId())) {
                        finalPlayerIds.add(q.getPlayerId());
                    }
                }

                boolean inherit = nextStage.getInheritScores() != null && nextStage.getInheritScores() == 1;
                for (String pid : finalPlayerIds) {
                    StagePlayerState nextState = new StagePlayerState();
                    nextState.setStageId(nextStage.getId());
                    nextState.setPlayerId(pid);
                    int carryScore = 0;
                    if (inherit) {
                        List<StagePlayerState> prevStates = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                                .eq(StagePlayerState::getPlayerId, pid)
                                .ne(StagePlayerState::getStageId, nextStage.getId()));
                        if (!prevStates.isEmpty()) {
                            StagePlayerState lastState = prevStates.get(prevStates.size() - 1);
                            if (lastState.getTotalScore() != null) {
                                carryScore = lastState.getTotalScore();
                            }
                        }
                    }
                    nextState.setCarryOverScore(carryScore);
                    nextState.setStageScore(0);
                    nextState.setTotalScore(carryScore);
                    nextState.setFirstPlaceCount(0);
                    nextState.setTop4Count(0);
                    nextState.setAdvancementStatus(Constants.ADVANCE_NONE);
                    nextState.setIsMatchPoint(0);
                    stagePlayerStateMapper.insert(nextState);
                }
            } else {
                // 下一赛段是常规赛段：导入本赛段常规晋级选手 (ADVANCE_QUALIFIED)
                boolean inherit = nextStage.getInheritScores() != null && nextStage.getInheritScores() == 1;
                List<StagePlayerState> qualifiedStates = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                        .eq(StagePlayerState::getStageId, stageId)
                        .eq(StagePlayerState::getAdvancementStatus, Constants.ADVANCE_QUALIFIED));

                for (StagePlayerState prev : qualifiedStates) {
                    StagePlayerState nextState = new StagePlayerState();
                    nextState.setStageId(nextStage.getId());
                    nextState.setPlayerId(prev.getPlayerId());
                    int carryScore = inherit ? (prev.getTotalScore() != null ? prev.getTotalScore() : 0) : 0;
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

    private String findCheckmateWinnerId(Stage stage) {
        if (!Constants.STAGE_TYPE_CHECKPOINT_FINAL.equalsIgnoreCase(stage.getStageType())) {
            return null;
        }

        List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stage.getId()));
        if (groups.isEmpty()) return null;

        List<String> groupIds = groups.stream().map(StageGroup::getId).toList();
        List<MatchRound> allRounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                .in(MatchRound::getStageGroupId, groupIds)
                .orderByAsc(MatchRound::getRoundNumber));

        List<MatchRound> finishedRounds = allRounds.stream()
                .filter(r -> Constants.ROUND_FINISHED.equals(r.getStatus()))
                .toList();
        if (finishedRounds.isEmpty()) return null;

        List<StagePlayerState> states = stagePlayerStateMapper.selectList(new LambdaQueryWrapper<StagePlayerState>()
                .eq(StagePlayerState::getStageId, stage.getId()));

        Map<String, Integer> runningScores = new HashMap<>();
        for (StagePlayerState state : states) {
            runningScores.put(state.getPlayerId(), state.getCarryOverScore() != null ? state.getCarryOverScore() : 0);
        }

        for (MatchRound mr : finishedRounds) {
            List<GameRecord> rRecords = gameRecordMapper.selectList(new LambdaQueryWrapper<GameRecord>()
                    .eq(GameRecord::getMatchRoundId, mr.getId()));

            for (GameRecord gr : rRecords) {
                int scoreBeforeThisRound = runningScores.getOrDefault(gr.getPlayerId(), 0);
                if (gr.getRank() == 1 && scoreBeforeThisRound >= 20) {
                    return gr.getPlayerId();
                }
            }

            for (GameRecord gr : rRecords) {
                runningScores.put(gr.getPlayerId(), runningScores.getOrDefault(gr.getPlayerId(), 0) + gr.getScore());
            }
        }

        return null;
    }

    private void checkAllRoundsFinished(String stageId) {
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null) return;

        boolean isFinal = Constants.STAGE_TYPE_CHECKPOINT_FINAL.equalsIgnoreCase(stage.getStageType());
        if (isFinal) {
            String checkmateWinnerId = findCheckmateWinnerId(stage);
            if (checkmateWinnerId != null) {
                // 已有选手达成 20分+吃鸡 登顶夺冠，总决赛提前完赛！
                return;
            }
        }

        List<StageGroup> groups = stageGroupMapper.selectList(new LambdaQueryWrapper<StageGroup>()
                .eq(StageGroup::getStageId, stageId));
        if (groups.isEmpty()) {
            throw new BizException("赛段尚未分组开赛，无法进行排名状态分配");
        }

        List<String> groupIds = groups.stream().map(StageGroup::getId).toList();
        List<MatchRound> allRounds = matchRoundMapper.selectList(new LambdaQueryWrapper<MatchRound>()
                .in(MatchRound::getStageGroupId, groupIds));
        if (allRounds.isEmpty()) {
            throw new BizException("赛段未生成对局，无法进行排名状态分配");
        }

        for (MatchRound r : allRounds) {
            if (!Constants.ROUND_FINISHED.equals(r.getStatus())) {
                throw new BizException("当前阶段尚有对局未完赛，只有在所有对局全部打完（或决赛产生20分登顶冠军）后，才能进行排名与晋级状态分配！");
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePlayerAdvancement(String stageId, String playerId, String advancementStatus) {
        checkStagePermission(stageId);
        checkAllRoundsFinished(stageId);
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }
        if (Constants.STAGE_LOCKED.equals(stage.getStatus())) {
            throw new BizException("已锁定的赛段不能修改选手晋级状态，请先解锁赛段");
        }

        StagePlayerState state = stagePlayerStateMapper.selectOne(new LambdaQueryWrapper<StagePlayerState>()
                .eq(StagePlayerState::getStageId, stageId)
                .eq(StagePlayerState::getPlayerId, playerId));
        if (state == null) {
            throw new BizException("未找到该选手的赛段状态记录");
        }

        List<String> validStatuses = List.of(
                Constants.ADVANCE_NONE,
                Constants.ADVANCE_QUALIFIED,
                Constants.ADVANCE_DIRECT_FINAL,
                Constants.ADVANCE_ELIMINATED,
                Constants.ADVANCE_CHAMPION
        );
        if (advancementStatus != null && !validStatuses.contains(advancementStatus)) {
            throw new BizException("不合法的晋级状态: " + advancementStatus);
        }

        state.setAdvancementStatus(advancementStatus != null ? advancementStatus : Constants.ADVANCE_NONE);
        stagePlayerStateMapper.updateById(state);

        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        if (tournament != null) {
            sseEmitterManager.broadcast(tournament.getShareCode(), "STAGE_UPDATED", Map.of("stageId", stageId));
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void autoAssignAdvancement(String stageId) {
        checkStagePermission(stageId);
        checkAllRoundsFinished(stageId);
        Stage stage = stageMapper.selectById(stageId);
        if (stage == null || stage.getIsDeleted() == 1) {
            throw new BizException("赛段不存在");
        }
        if (Constants.STAGE_LOCKED.equals(stage.getStatus())) {
            throw new BizException("已锁定的赛段不能重新分配状态");
        }

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
        boolean isFinal = "CHECKPOINT_FINAL".equalsIgnoreCase(stage.getStageType());

        for (int i = 0; i < totalCount; i++) {
            StagePlayerState s = states.get(i);
            s.setFinalRank(i + 1);
            if (isFinal) {
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

        Tournament tournament = tournamentMapper.selectById(stage.getTournamentId());
        if (tournament != null) {
            sseEmitterManager.broadcast(tournament.getShareCode(), "STAGE_UPDATED", Map.of("stageId", stageId));
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void clearGrouping(String stageId) {
        checkStagePermission(stageId);
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
        checkStagePermission(stageId);
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
