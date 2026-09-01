package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.Player;
import org.apache.ibatis.annotations.Mapper;

/**
 * 参赛选手花名册数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface PlayerMapper extends BaseMapper<Player> {
}
