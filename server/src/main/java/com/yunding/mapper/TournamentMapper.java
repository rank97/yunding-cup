package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.Tournament;
import org.apache.ibatis.annotations.Mapper;

/**
 * 赛事主表数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface TournamentMapper extends BaseMapper<Tournament> {
}
