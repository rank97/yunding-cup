package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.StageGroupPlayer;
import org.apache.ibatis.annotations.Mapper;

/**
 * 房间分组选手席位排布数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface StageGroupPlayerMapper extends BaseMapper<StageGroupPlayer> {
}
