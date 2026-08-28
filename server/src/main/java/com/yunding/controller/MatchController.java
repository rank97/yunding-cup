package com.yunding.controller;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yunding.common.Result;
import com.yunding.dto.RoundRecordSubmitDTO;
import com.yunding.service.MatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/match-rounds")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @PostMapping("/{roundId}/records")
    @SaCheckLogin
    public Result<?> submitRoundRecord(@PathVariable String roundId, @RequestBody @Valid RoundRecordSubmitDTO dto) {
        matchService.submitRoundRecord(roundId, dto);
        return Result.success();
    }

    @DeleteMapping("/{roundId}/records")
    @SaCheckLogin
    public Result<?> resetRoundRecord(@PathVariable String roundId) {
        matchService.resetRoundRecord(roundId);
        return Result.success();
    }
}
