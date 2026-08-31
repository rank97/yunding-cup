package com.yunding.service;

import com.yunding.dto.PlayerBatchImportDTO;
import com.yunding.entity.Player;
import com.yunding.entity.Stage;
import java.util.List;
import java.util.Map;

public interface StageService {
    void importPlayers(PlayerBatchImportDTO dto);
    List<Player> listPlayers(String tournamentId);
    Player updatePlayer(String playerId, String name, String gameId, String avatarUrl);
    Map<String, Object> getStageDetail(String stageId);
    void executeGrouping(String stageId, String mode);
    void swapPlayers(String stageId, String player1Id, String player2Id);
    void clearGrouping(String stageId);
    void lockStage(String stageId);
    void unlockStage(String stageId);
    void updatePlayerAdvancement(String stageId, String playerId, String advancementStatus);
    void autoAssignAdvancement(String stageId);
}
