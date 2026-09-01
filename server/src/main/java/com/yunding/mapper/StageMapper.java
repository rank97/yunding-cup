package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.Stage;
import org.apache.ibatis.annotations.Mapper;

/**
 * 赛段配置数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface StageMapper extends BaseMapper<Stage> {
}
