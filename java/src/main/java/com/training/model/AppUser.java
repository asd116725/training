package com.training.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** 应用登录用户实体。 */
@Entity
@Table(name = "app_users")
public class AppUser {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 手机号。 */
    @Column(nullable = false, unique = true, length = 20)
    public String phone;

    /** BCrypt 密码哈希。 */
    @Column(nullable = false)
    public String passwordHash;

    /** 创建时间。 */
    @Column(nullable = false)
    public Instant createdAt;

    /** JPA 构造函数。 */
    protected AppUser() {
    }

    /** 创建应用用户。 */
    public AppUser(String phone, String passwordHash) {
        this.phone = phone;
        this.passwordHash = passwordHash;
    }

    /** 保存前补充创建时间。 */
    @PrePersist
    protected void prePersist() {
        this.createdAt = Instant.now();
    }
}
