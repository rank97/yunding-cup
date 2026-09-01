package com.yunding.config;

import cn.dev33.satoken.secure.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yunding.common.Constants;
import com.yunding.dto.PlayerBatchImportDTO;
import com.yunding.dto.StageCreateDTO;
import com.yunding.dto.TournamentCreateDTO;
import com.yunding.entity.ScoreRule;
import com.yunding.entity.Tournament;
import com.yunding.entity.User;
import com.yunding.mapper.ScoreRuleMapper;
import com.yunding.mapper.TournamentMapper;
import com.yunding.mapper.UserMapper;
import com.yunding.service.StageService;
import com.yunding.service.TournamentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * 数据库启动初始化与默认示范数据装配器
 * <p>
 * 在系统首次启动或数据库为空时：
 * 1. 自动初始化 8 分制标准规则与 9 分制吃鸡加权规则；
 * 2. 自动初始化超管账号 (admin / 123456) 与默认主办方账号 (user / 123456)；
 * 3. 自动生成一场涵盖初赛、半决赛（带直通）、复活赛与 20 分登顶决赛的 32 人示范赛及知名选手名册。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final ScoreRuleMapper scoreRuleMapper;
    private final TournamentMapper tournamentMapper;
    private final TournamentService tournamentService;
    private final StageService stageService;

    @Override
    public void run(String... args) {
        // 0. 初始化系统标准积分规则模板
        ScoreRule rule1 = scoreRuleMapper.selectById("1");
        if (rule1 == null) {
            rule1 = new ScoreRule();
            rule1.setId("1");
            rule1.setTenantId("GLOBAL");
            rule1.setRuleName("官方标准积分规则 (8-7-6-5-4-3-2-1)");
            rule1.setIsSystemDefault(1);
            rule1.setScoreMapping("{\"1\":8,\"2\":7,\"3\":6,\"4\":5,\"5\":4,\"6\":3,\"7\":2,\"8\":1}");
            rule1.setCreatedAt(new Date());
            scoreRuleMapper.insert(rule1);
            log.info(">>> 默认标准积分规则 (8-7-6-5-4-3-2-1) 已初始化");
        }

        ScoreRule rule2 = scoreRuleMapper.selectById("2");
        if (rule2 == null) {
            rule2 = new ScoreRule();
            rule2.setId("2");
            rule2.setTenantId("GLOBAL");
            rule2.setRuleName("吃鸡加权积分规则 (9-7-6-5-4-3-2-1)");
            rule2.setIsSystemDefault(0);
            rule2.setScoreMapping("{\"1\":9,\"2\":7,\"3\":6,\"4\":5,\"5\":4,\"6\":3,\"7\":2,\"8\":1}");
            rule2.setCreatedAt(new Date());
            scoreRuleMapper.insert(rule2);
            log.info(">>> 默认吃鸡加权积分规则 (9-7-6-5-4-3-2-1) 已初始化");
        }

        // 1. 初始化默认超管账号 (admin / 123456)
        User admin = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "admin"));
        if (admin == null) {
            admin = new User();
            admin.setUsername("admin");
            admin.setPasswordHash(BCrypt.hashpw("123456"));
            admin.setRole(Constants.ROLE_SUPER_ADMIN);
            admin.setCreatedAt(new Date());
            admin.setUpdatedAt(new Date());
            userMapper.insert(admin);
            log.info(">>> 默认超管账号已初始化: admin / 123456");
        }

        // 1.1 初始化默认普通主办方账号 (user / 123456)
        User normalUser = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "user"));
        if (normalUser == null) {
            normalUser = new User();
            normalUser.setUsername("user");
            normalUser.setPasswordHash(BCrypt.hashpw("123456"));
            normalUser.setRole(Constants.ROLE_ORGANIZER);
            normalUser.setCreatedAt(new Date());
            normalUser.setUpdatedAt(new Date());
            userMapper.insert(normalUser);
            log.info(">>> 默认主办方账号已初始化: user / 123456");
        }

        // 2. 如果数据库没有任何赛事，自动初始化一场 32 人示范赛
        Long count = tournamentMapper.selectCount(new LambdaQueryWrapper<Tournament>().eq(Tournament::getIsDeleted, 0));
        if (count == 0) {
            log.info(">>> 数据库为空，开始初始化 32 人 TOC 官方示范赛事...");
            TournamentCreateDTO tDto = new TournamentCreateDTO();
            tDto.setTitle("2026 第一届云顶之弈月亮杯全国大师赛");
            tDto.setTotalPlayers(32);

            List<StageCreateDTO> stages = new ArrayList<>();
            // 初赛：32人 -> 4组，打3局，淘汰8人，直通0人，晋级24人
            StageCreateDTO s1 = new StageCreateDTO();
            s1.setName("初赛 (32进24)");
            s1.setRoundCount(3);
            s1.setDirectToFinalCount(0);
            s1.setEliminateCount(8);
            s1.setInheritScores(0);
            s1.setScoreRuleId("1");
            stages.add(s1);

            // 半决赛：24人 -> 3组，打5局，直通决赛4人，淘汰4人，流转复活赛16人
            StageCreateDTO s2 = new StageCreateDTO();
            s2.setName("半决赛 (24进4直通)");
            s2.setRoundCount(5);
            s2.setDirectToFinalCount(4);
            s2.setEliminateCount(4);
            s2.setInheritScores(1);
            s2.setScoreRuleId("1");
            stages.add(s2);

            // 复活突围赛：16人 -> 2组，打5局，前4晋级决赛，淘汰12人
            StageCreateDTO s3 = new StageCreateDTO();
            s3.setName("突围复活赛 (16进4)");
            s3.setRoundCount(5);
            s3.setDirectToFinalCount(0);
            s3.setEliminateCount(12);
            s3.setInheritScores(0);
            s3.setScoreRuleId("1");
            stages.add(s3);

            // 巅峰总决赛：8人 (半决赛4人 + 复活赛4人)，20分登顶
            StageCreateDTO s4 = new StageCreateDTO();
            s4.setName("巅峰总决赛 (20分登顶)");
            s4.setRoundCount(8);
            s4.setDirectToFinalCount(0);
            s4.setEliminateCount(0);
            s4.setInheritScores(0);
            s4.setScoreRuleId("1");
            stages.add(s4);

            tDto.setStages(stages);
            Tournament createdTournament = tournamentService.createTournament(tDto, admin.getId());

            // 自动导入 32 位电竞大师花名册
            String[] playerNames = {
                    "红莲", "李少", "幻灭", "慎独", "弃徒", "阿陈", "神超", "童扬",
                    "琉璃", "卷子", "初音", "小团", "空城", "梨落", "小鱼", "月亮",
                    "晴天", "星尘", "风暴", "雷霆", "黑羽", "苍穹", "无极", "追梦",
                    "夜月", "凌云", "破晓", "逐日", "流星", "极光", "天行", "问鼎"
            };

            PlayerBatchImportDTO pDto = new PlayerBatchImportDTO();
            pDto.setTournamentId(createdTournament.getId());
            List<PlayerBatchImportDTO.PlayerItem> pList = new ArrayList<>();
            for (int i = 0; i < playerNames.length; i++) {
                PlayerBatchImportDTO.PlayerItem pItem = new PlayerBatchImportDTO.PlayerItem();
                pItem.setName(playerNames[i]);
                pItem.setGameId(playerNames[i] + "_Pro");
                pList.add(pItem);
            }
            pDto.setPlayers(pList);
            stageService.importPlayers(pDto);

            log.info(">>> 32 人示范赛及选手名册初始化成功，观赛码: {}", createdTournament.getShareCode());
        }
    }
}
