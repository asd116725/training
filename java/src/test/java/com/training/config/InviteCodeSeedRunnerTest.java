package com.training.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.training.model.InviteCode;
import com.training.repository.InviteCodeRepository;

/** 邀请码初始化器测试。 */
@ExtendWith(MockitoExtension.class)
class InviteCodeSeedRunnerTest {

    /** 邀请码仓库。 */
    @Mock
    private InviteCodeRepository inviteCodeRepository;

    /** 验证从环境配置读取邀请码并过滤空值和重复项。 */
    @Test
    void shouldSeedInviteCodesFromConfig() {
        when(inviteCodeRepository.existsByCode("FIT-DEMO-1")).thenReturn(false);
        when(inviteCodeRepository.existsByCode("FIT-DEMO-2")).thenReturn(false);
        InviteCodeSeedRunner runner = new InviteCodeSeedRunner(inviteCodeRepository,
                " FIT-DEMO-1, ,FIT-DEMO-2\nFIT-DEMO-1 ");

        runner.run(null);

        ArgumentCaptor<InviteCode> captor = ArgumentCaptor.forClass(InviteCode.class);
        verify(inviteCodeRepository, times(2)).save(captor.capture());
        assertEquals(List.of("FIT-DEMO-1", "FIT-DEMO-2"),
                captor.getAllValues().stream().map(code -> code.code).toList());
    }

    /** 验证未配置邀请码时不写入数据。 */
    @Test
    void shouldSkipWhenInviteCodesAreBlank() {
        InviteCodeSeedRunner runner = new InviteCodeSeedRunner(inviteCodeRepository, " ");

        runner.run(null);

        verify(inviteCodeRepository, never()).save(any(InviteCode.class));
    }
}
