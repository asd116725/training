package com.training.service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.training.dto.ApiDtos.AuthLoginRequest;
import com.training.dto.ApiDtos.AuthRegisterRequest;
import com.training.dto.ApiDtos.AuthResponse;
import com.training.dto.ApiDtos.AuthUserResponse;
import com.training.model.AppUser;
import com.training.model.AuthSession;
import com.training.model.InviteCode;
import com.training.repository.AppUserRepository;
import com.training.repository.AuthSessionRepository;
import com.training.repository.InviteCodeRepository;

/** 注册登录业务服务。 */
@Service
public class AuthService {

    /** Token 随机数生成器。 */
    private final SecureRandom secureRandom = new SecureRandom();

    /** 密码编码器。 */
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /** 用户仓库。 */
    private final AppUserRepository appUserRepository;

    /** 邀请码仓库。 */
    private final InviteCodeRepository inviteCodeRepository;

    /** 会话仓库。 */
    private final AuthSessionRepository authSessionRepository;

    /** 历史数据认领服务。 */
    private final LegacyDataClaimService legacyDataClaimService;

    /** 默认食材补种服务。 */
    private final DefaultFoodSeedService defaultFoodSeedService;

    /** 创建注册登录服务。 */
    public AuthService(AppUserRepository appUserRepository, InviteCodeRepository inviteCodeRepository,
            AuthSessionRepository authSessionRepository, LegacyDataClaimService legacyDataClaimService,
            DefaultFoodSeedService defaultFoodSeedService) {
        this.appUserRepository = appUserRepository;
        this.inviteCodeRepository = inviteCodeRepository;
        this.authSessionRepository = authSessionRepository;
        this.legacyDataClaimService = legacyDataClaimService;
        this.defaultFoodSeedService = defaultFoodSeedService;
    }

    /** 注册新用户。 */
    @Transactional
    public AuthResponse register(AuthRegisterRequest request) {
        String phone = normalizePhone(request.phone());

        if (appUserRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "手机号已注册");
        }

        InviteCode inviteCode = inviteCodeRepository.findByCode(normalizeInviteCode(request.inviteCode()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "邀请码无效"));

        if (!inviteCode.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "邀请码已被使用");
        }

        AppUser user = appUserRepository.save(new AppUser(phone, passwordEncoder.encode(request.password())));
        inviteCode.usedBy = user;
        inviteCode.usedAt = Instant.now();
        inviteCodeRepository.save(inviteCode);

        if (appUserRepository.count() == 1) {
            legacyDataClaimService.claimForFirstUser(user);
        }

        defaultFoodSeedService.seedForUser(user);

        return createAuthResponse(user);
    }

    /** 登录用户。 */
    @Transactional
    public AuthResponse login(AuthLoginRequest request) {
        AppUser user = appUserRepository.findByPhone(normalizePhone(request.phone()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "手机号或密码错误"));

        if (!passwordEncoder.matches(request.password(), user.passwordHash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "手机号或密码错误");
        }

        return createAuthResponse(user);
    }

    /** 根据 token 获取登录用户。 */
    public AppUser authenticate(String token) {
        String tokenHash = hashToken(token);
        return authSessionRepository.findByTokenHashAndExpiresAtAfter(tokenHash, Instant.now())
                .map(session -> session.user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录"));
    }

    /** 查询当前用户响应。 */
    public AuthUserResponse currentUser(AppUser user) {
        return toUserResponse(user);
    }

    /** 退出当前会话。 */
    @Transactional
    public void logout(String token) {
        authSessionRepository.deleteByTokenHash(hashToken(token));
    }

    /** 创建登录响应。 */
    private AuthResponse createAuthResponse(AppUser user) {
        String token = createToken();
        Instant expiresAt = Instant.now().plus(30, ChronoUnit.DAYS);
        authSessionRepository.deleteByExpiresAtBefore(Instant.now());
        authSessionRepository.save(new AuthSession(user, hashToken(token), expiresAt));
        return new AuthResponse(token, toUserResponse(user));
    }

    /** 转换用户响应。 */
    private AuthUserResponse toUserResponse(AppUser user) {
        return new AuthUserResponse(user.id, user.phone);
    }

    /** 创建随机 token。 */
    private String createToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** 哈希 token。 */
    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception error) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录");
        }
    }

    /** 标准化邀请码。 */
    private String normalizeInviteCode(String inviteCode) {
        return inviteCode.trim().toUpperCase();
    }

    /** 标准化手机号。 */
    private String normalizePhone(String phone) {
        return phone.trim();
    }
}
