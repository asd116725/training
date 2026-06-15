package com.training.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.training.dto.ApiDtos.AuthLoginRequest;
import com.training.dto.ApiDtos.AuthRegisterRequest;
import com.training.dto.ApiDtos.AuthResponse;
import com.training.dto.ApiDtos.AuthUserResponse;
import com.training.service.AuthService;
import com.training.service.CurrentUserContext;

import jakarta.validation.Valid;

/** 注册登录接口。 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /** 注册登录服务。 */
    private final AuthService authService;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext;

    /** 创建注册登录接口。 */
    public AuthController(AuthService authService, CurrentUserContext currentUserContext) {
        this.authService = authService;
        this.currentUserContext = currentUserContext;
    }

    /** 注册账号。 */
    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody AuthRegisterRequest request) {
        return authService.register(request);
    }

    /** 登录账号。 */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthLoginRequest request) {
        return authService.login(request);
    }

    /** 查询当前登录用户。 */
    @GetMapping("/me")
    public AuthUserResponse me() {
        return authService.currentUser(currentUserContext.get());
    }

    /** 退出登录。 */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(name = "Authorization", required = false) String authorization) {
        authService.logout(extractToken(authorization));
        return ResponseEntity.noContent().build();
    }

    /** 从请求头提取 token。 */
    private String extractToken(String authorization) {
        return authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : "";
    }
}
