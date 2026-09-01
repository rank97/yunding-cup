package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.ScoreRule;
import org.apache.ibatis.annotations.Mapper;

/**
 * 积分规则模板数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface ScoreRuleMapper extends BaseMapper<ScoreRule> {
}
