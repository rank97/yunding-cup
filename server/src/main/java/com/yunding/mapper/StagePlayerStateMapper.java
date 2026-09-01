package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.StagePlayerState;
import org.apache.ibatis.annotations.Mapper;

/**
 * 赛段内选手状态与累计积分数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface StagePlayerStateMapper extends BaseMapper<StagePlayerState> {
}
