package com.yunding.service;

import com.yunding.dto.RoundRecordSubmitDTO;

public interface MatchService {
    void submitRoundRecord(String matchRoundId, RoundRecordSubmitDTO dto);
    void resetRoundRecord(String matchRoundId);
}
