package com.yunding.config;

import cn.dev33.satoken.secure.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yunding.common.Constants;
import com.yunding.dto.PlayerBatchImportDTO;
import com.yunding.dto.StageCreateDTO;
import com.yunding.dto.TournamentCreateDTO;
import com.yunding.entity.Tournament;
import com.yunding.entity.User;
import com.yunding.mapper.TournamentMapper;
import com.yunding.mapper.UserMapper;
import com.yunding.service.AuthService;
import com.yunding.service.StageService;
import com.yunding.service.TournamentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final TournamentMapper tournamentMapper;
    private final TournamentService tournamentService;
    private final StageService stageService;

    @Override
    public void run(String... args) {
        // 1. 初始化超管账号 (admin / 123456)
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
            log.info(">>> 开始初始化 32 人演示赛事...");
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
            stages.add(s1);

            // 半决赛：24人 -> 3组，打5局，直通决赛4人，淘汰4人，流转复活赛16人
            StageCreateDTO s2 = new StageCreateDTO();
            s2.setName("半决赛 (24进4直通)");
            s2.setRoundCount(5);
            s2.setDirectToFinalCount(4);
            s2.setEliminateCount(4);
            s2.setInheritScores(1);
            stages.add(s2);

            // 复活突围赛：16人 -> 2组，打5局，前4晋级决赛，淘汰12人
            StageCreateDTO s3 = new StageCreateDTO();
            s3.setName("突围复活赛 (16进4)");
            s3.setRoundCount(5);
            s3.setDirectToFinalCount(0);
            s3.setEliminateCount(12);
            s3.setInheritScores(0);
            stages.add(s3);

            // 巅峰总决赛：8人 (半决赛4人 + 复活赛4人)，20分登顶
            StageCreateDTO s4 = new StageCreateDTO();
            s4.setName("巅峰总决赛 (20分登顶)");
            s4.setRoundCount(5);
            s4.setDirectToFinalCount(0);
            s4.setEliminateCount(0);
            s4.setInheritScores(0);
            s4.setStageType("CHECKPOINT_FINAL");
            stages.add(s4);

            tDto.setStages(stages);
            Tournament t = tournamentService.createTournament(tDto, admin.getId());

            // 批量录入 32 位电竞选手
            String[] names = {
                "红莲", "弃徒", "慎独", "神超", "幻灭", "阿陈", "琉璃", "童扬",
                "冰哥", "卷子", "爱萝莉", "徐清林", "迅哥", "小钰", "黑皮", "星痕",
                "夜月", "疾风", "狂刀", "无双", "流星", "苍穹", "幽冥", "雷霆",
                "赤焰", "霜华", "追风", "傲雪", "寒霜", "断水", "破空", "御龙"
            };

            PlayerBatchImportDTO pDto = new PlayerBatchImportDTO();
            pDto.setTournamentId(t.getId());
            List<PlayerBatchImportDTO.PlayerItem> pList = new ArrayList<>();
            for (int i = 0; i < names.length; i++) {
                PlayerBatchImportDTO.PlayerItem item = new PlayerBatchImportDTO.PlayerItem();
                item.setName(names[i]);
                item.setGameId("TFT_" + (i + 1));
                item.setInitialSeed(i + 1);
                pList.add(item);
            }
            pDto.setPlayers(pList);
            stageService.importPlayers(pDto);

            // 执行初赛蛇形分组
            stageService.executeGrouping(t.getCurrentStageId(), "SNAKE");
            log.info(">>> 32 人演示赛事初始化完毕！分享码: {}", t.getShareCode());
        }
    }
}
