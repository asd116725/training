package com.training.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.lang.reflect.Method;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;

/** 邀请码仓库测试。 */
class InviteCodeRepositoryTest {

    /** 验证注册读取邀请码时使用写锁。 */
    @Test
    void shouldLockInviteCodeWhenFindingByCode() throws Exception {
        Method method = InviteCodeRepository.class.getMethod("findByCode", String.class);
        Lock lock = method.getAnnotation(Lock.class);

        assertNotNull(lock);
        assertEquals(LockModeType.PESSIMISTIC_WRITE, lock.value());
        assertEquals(Optional.class, method.getReturnType());
    }
}
