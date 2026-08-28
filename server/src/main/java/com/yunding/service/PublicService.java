package com.yunding.service;

import com.yunding.entity.Tournament;
import com.yunding.vo.GroupDetailsVO;
import com.yunding.vo.StageLeaderboardVO;
import com.yunding.vo.TournamentOverviewVO;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

public interface PublicService {
    List<Tournament> listPublicTournaments();
    TournamentOverviewVO getTournamentOverview(String shareCode);
    StageLeaderboardVO getStageLeaderboard(String shareCode, String stageId);
    GroupDetailsVO getGroupDetails(String shareCode, String stageId);
    SseEmitter createSseEmitter(String shareCode);
}
