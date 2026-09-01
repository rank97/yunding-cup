package com.yunding.service;

import com.yunding.dto.RoundRecordSubmitDTO;
import com.yunding.entity.Stage;

/**
 * 房间小局比赛与战绩核算业务接口
 *
 * @author TFT-TourneyOS Team
 */
public interface MatchService {

    /**
     * 录入或更新单小局 8 位选手的名次与积分成绩（触发累计积分重算与 SSE 广播）
     *
     * @param matchRoundId 小局 ID
     * @param dto          8 位选手名次提交 DTO
     */
    void submitRoundRecord(String matchRoundId, RoundRecordSubmitDTO dto);

    /**
     * 作废并重置指定小局的成绩记录
     *
     * @param matchRoundId 小局 ID
     */
    void resetRoundRecord(String matchRoundId);

    /**
     * 重新核算指定赛段所有选手的累积总分、小局得分、吃鸡数、前四数与赛点状态
     *
     * @param stageId 赛段 ID
     */
    void recalculateStageScores(String stageId);

    /**
     * 重新核算指定赛段实体的所有选手成绩与 20 分赛点登顶夺冠逻辑
     *
     * @param stage 赛段实体
     */
    void recalculateStageScores(Stage stage);
}
