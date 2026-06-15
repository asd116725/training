package com.training.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.training.dto.ApiDtos.AuthRegisterRequest;
import com.training.dto.ApiDtos.AuthResponse;
import com.training.model.AppUser;
import com.training.model.AuthSession;
import com.training.model.InviteCode;
import com.training.repository.AppUserRepository;
import com.training.repository.AuthSessionRepository;
import com.training.repository.InviteCodeRepository;

/** 注册登录服务测试。 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    /** 用户仓库。 */
    @Mock
    private AppUserRepository appUserRepository;

    /** 邀请码仓库。 */
    @Mock
    private InviteCodeRepository inviteCodeRepository;

    /** 会话仓库。 */
    @Mock
    private AuthSessionRepository authSessionRepository;

    /** 历史数据认领服务。 */
    @Mock
    private LegacyDataClaimService legacyDataClaimService;

    /** 默认食材补种服务。 */
    @Mock
    private DefaultFoodSeedService defaultFoodSeedService;

    /** 被测注册登录服务。 */
    private AuthService authService;

    /** 初始化测试服务。 */
    @BeforeEach
    void setUp() {
        authService = new AuthService(appUserRepository, inviteCodeRepository, authSessionRepository,
                legacyDataClaimService, defaultFoodSeedService);
    }

    /** 验证注册后补种默认食材。 */
    @Test
    void shouldSeedDefaultFoodsAfterRegister() {
        AppUser user = new AppUser("13800000000", "hash");
        user.id = 1L;
        when(appUserRepository.existsByPhone("13800000000")).thenReturn(false);
        when(inviteCodeRepository.findByCode("FIT-TEST")).thenReturn(Optional.of(new InviteCode("FIT-TEST")));
        when(appUserRepository.save(any(AppUser.class))).thenReturn(user);
        when(appUserRepository.count()).thenReturn(2L);
        when(authSessionRepository.save(any(AuthSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.register(
                new AuthRegisterRequest("13800000000", "123456", "fit-test"));

        assertEquals(1L, response.user().id());
        verify(defaultFoodSeedService).seedForUser(user);
    }
}
