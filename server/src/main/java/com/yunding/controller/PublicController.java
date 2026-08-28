package com.yunding.controller;

import com.yunding.common.Result;
import com.yunding.service.PublicService;
import com.yunding.vo.GroupDetailsVO;
import com.yunding.vo.StageLeaderboardVO;
import com.yunding.vo.TournamentOverviewVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.yunding.entity.Tournament;
import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

    private final PublicService publicService;

    @GetMapping("/tournaments")
    public Result<List<Tournament>> listTournaments() {
        return Result.success(publicService.listPublicTournaments());
    }

    @GetMapping("/tournaments/{shareCode}/overview")
    public Result<TournamentOverviewVO> getTournamentOverview(@PathVariable String shareCode) {
        return Result.success(publicService.getTournamentOverview(shareCode));
    }

    @GetMapping("/tournaments/{shareCode}/stages/{stageId}/leaderboard")
    public Result<StageLeaderboardVO> getStageLeaderboard(@PathVariable String shareCode, @PathVariable String stageId) {
        return Result.success(publicService.getStageLeaderboard(shareCode, stageId));
    }

    @GetMapping("/tournaments/{shareCode}/stages/{stageId}/group-details")
    public Result<GroupDetailsVO> getGroupDetails(@PathVariable String shareCode, @PathVariable String stageId) {
        return Result.success(publicService.getGroupDetails(shareCode, stageId));
    }

    @GetMapping(value = "/tournaments/{shareCode}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String shareCode) {
        return publicService.createSseEmitter(shareCode);
    }
}
