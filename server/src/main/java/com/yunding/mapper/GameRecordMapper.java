package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.GameRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 单小局选手名次与得分明细数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface GameRecordMapper extends BaseMapper<GameRecord> {
}
