package com.yunding.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yunding.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户认证与权限数据访问层 Mapper
 *
 * @author TFT-TourneyOS Team
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
