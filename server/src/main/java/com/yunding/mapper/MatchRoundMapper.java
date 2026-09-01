package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.MatchRound;
import org.apache.ibatis.annotations.Mapper;

/**
 * 房间小局对局表数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface MatchRoundMapper extends BaseMapper<MatchRound> {
}
