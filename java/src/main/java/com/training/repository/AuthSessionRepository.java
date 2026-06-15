package com.training.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.training.model.AuthSession;

/** 登录会话仓库。 */
public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    /** 按 token 哈希查询有效会话。 */
    Optional<AuthSession> findByTokenHashAndExpiresAtAfter(String tokenHash, Instant now);

    /** 删除当前 token 会话。 */
    void deleteByTokenHash(String tokenHash);

    /** 清理过期会话。 */
    void deleteByExpiresAtBefore(Instant now);
}
