package com.yunding.dto;

import lombok.Data;
import java.util.List;

@Data
public class PlayerBatchImportDTO {
    private String tournamentId;
    private List<PlayerItem> players;

    @Data
    public static class PlayerItem {
        private String name;
        private String gameId;
        private String avatarUrl;
        private Integer initialSeed;
    }
}
