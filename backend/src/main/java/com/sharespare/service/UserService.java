package com.sharespare.service;

import com.sharespare.dto.request.LoginRequest;
import com.sharespare.dto.request.RegisterRequest;
import com.sharespare.dto.request.UpdateProfileRequest;
import com.sharespare.dto.response.JwtAuthResponse;
import com.sharespare.dto.response.UserDto;

public interface UserService {

    UserDto registerUser(RegisterRequest registerRequest);

    JwtAuthResponse authenticateUser(LoginRequest loginRequest);

    UserDto getCurrentUserProfile(String email);

    UserDto updateUserProfile(String email, UpdateProfileRequest updateProfileRequest);
}
