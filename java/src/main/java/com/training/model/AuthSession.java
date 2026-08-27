package com.training.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** 登录会话实体。 */
@Entity
@Table(name = "auth_sessions")
public class  AuthSession {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 登录用户。 */
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    public AppUser user;

    /** Token 哈希。 */
    @Column(nullable = false, unique = true, length = 120)
    public String tokenHash;

    /** 过期时间。 */
    @Column(nullable = false)
    public Instant expiresAt;

    /** 创建时间。 */
    @Column(nullable = false)
    public Instant createdAt;

    /** JPA 构造函数。 */
    protected AuthSession() {
    }

    /** 创建登录会话。 */
    public AuthSession(AppUser user, String tokenHash, Instant expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    /** 保存前补充创建时间。 */
    @PrePersist
    protected void prePersist() {
        this.createdAt = Instant.now();
    }
}
