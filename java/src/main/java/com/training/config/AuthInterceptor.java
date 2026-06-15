package com.training.config;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.training.model.AppUser;
import com.training.service.AuthService;
import com.training.service.CurrentUserContext;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** API 登录拦截器。 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    /** 注册登录服务。 */
    private final AuthService authService;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext;

    /** 创建 API 登录拦截器。 */
    public AuthInterceptor(AuthService authService, CurrentUserContext currentUserContext) {
        this.authService = authService;
        this.currentUserContext = currentUserContext;
    }

    /** 请求前校验登录态。 */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if (isPublicRequest(request)) {
            return true;
        }

        String token = extractToken(request.getHeader("Authorization"));

        if (token.isBlank()) {
            writeUnauthorized(response);
            return false;
        }

        try {
            AppUser user = authService.authenticate(token);
            currentUserContext.set(user);
            return true;
        } catch (Exception error) {
            writeUnauthorized(response);
            return false;
        }
    }

    /** 请求结束后清理用户上下文。 */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception error) {
        currentUserContext.clear();
    }

    /** 判断是否为公开请求。 */
    private boolean isPublicRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || !uri.startsWith("/api/")
                || "/api/auth/register".equals(uri)
                || "/api/auth/login".equals(uri);
    }

    /** 从请求头提取 token。 */
    private String extractToken(String authorization) {
        return authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : "";
    }

    /** 写入未登录响应。 */
    private void writeUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"请先登录\"}");
    }
}
