package com.yunding.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 参赛选手花名册批量导入 DTO
 *
 * @author TFT-TourneyOS Team
 */
@Data
public class PlayerBatchImportDTO {

    /**
     * 所属赛事 ID
     */
    private String tournamentId;

    /**
     * 选手条目列表
     */
    @NotEmpty(message = "选手列表不能为空")
    @Valid
    private List<PlayerItem> players;

    /**
     * 单个选手条目
     */
    @Data
    public static class PlayerItem {
        /**
         * 选手真实姓名 / 参赛称呼
         */
        @NotBlank(message = "选手姓名不能为空")
        private String name;

        /**
         * 选手游戏内 ID
         */
        @NotBlank(message = "选手游戏ID不能为空")
        private String gameId;

        /**
         * 选手头像 URL (可选)
         */
        private String avatarUrl;

        /**
         * 初始种子序号 (可选，默认按列表顺序生成 1~N)
         */
        private Integer initialSeed;
    }
}
