package com.yunding.service;

import com.yunding.dto.StageCreateDTO;
import com.yunding.dto.TournamentCreateDTO;
import com.yunding.entity.Tournament;
import java.util.List;
import java.util.Map;

import com.yunding.dto.TournamentUpdateDTO;

public interface TournamentService {
    Tournament createTournament(TournamentCreateDTO dto, String tenantId);
    Tournament updateTournament(String tournamentId, TournamentUpdateDTO dto, String tenantId, String role);
    List<Tournament> listTournaments(String tenantId, String role);
    Map<String, Object> getTournamentDetail(String tournamentId, String tenantId);
    void updateStages(String tournamentId, List<StageCreateDTO> stages, String tenantId);
    void deleteTournament(String tournamentId, String tenantId);
}
