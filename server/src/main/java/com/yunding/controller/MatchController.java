package com.yunding.controller;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yunding.common.Result;
import com.yunding.dto.RoundRecordSubmitDTO;
import com.yunding.service.MatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 房间小局比赛与成绩录入控制器
 * <p>
 * 处理裁判单局 1~8 名战绩成绩提交、自动重算累计积分、20分登顶赛点判定及对局作废重置等操作。
 * </p>
 *
 * @author TFT-TourneyOS Team
 */
@RestController
@RequestMapping("/api/v1/match-rounds")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    /**
     * 录入或更新单小局 8 位选手的名次与战绩
     * <p>
     * 录入成功后自动重新计算累积分数、更新排名、判定赛点/夺冠，并向大屏推送实时 SSE 事件。
     * </p>
     *
     * @param roundId 小局对局 ID
     * @param dto     8 位选手的名次分配参数
     * @return 操作成功结果
     */
    @PostMapping("/{roundId}/records")
    @SaCheckLogin
    public Result<?> submitRoundRecord(@PathVariable String roundId, @RequestBody @Valid RoundRecordSubmitDTO dto) {
        matchService.submitRoundRecord(roundId, dto);
        return Result.success();
    }

    /**
     * 作废并重置指定小局的成绩记录
     * <p>
     * 将该小局状态重置为待开赛（PENDING），清空单局得分并重新汇总赛段积分。
     * </p>
     *
     * @param roundId 小局对局 ID
     * @return 操作成功结果
     */
    @DeleteMapping("/{roundId}/records")
    @SaCheckLogin
    public Result<?> resetRoundRecord(@PathVariable String roundId) {
        matchService.resetRoundRecord(roundId);
        return Result.success();
    }
}
