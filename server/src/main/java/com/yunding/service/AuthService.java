package com.yunding.service;

import com.yunding.dto.LoginDTO;
import com.yunding.dto.PasswordUpdateDTO;
import com.yunding.dto.RegisterDTO;
import com.yunding.entity.User;
import java.util.Map;

public interface AuthService {
    Map<String, Object> login(LoginDTO dto);
    User register(RegisterDTO dto);
    User getCurrentUser();
    void updatePassword(PasswordUpdateDTO dto);
}

