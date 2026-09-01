package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.StageGroup;
import org.apache.ibatis.annotations.Mapper;

/**
 * 赛段房间分组数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface StageGroupMapper extends BaseMapper<StageGroup> {
}
