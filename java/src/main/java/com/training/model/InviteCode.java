package com.training.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** 注册邀请码实体。 */
@Entity
@Table(name = "invite_codes")
public class InviteCode {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 邀请码。 */
    @Column(nullable = false, unique = true, length = 40)
    public String code;

    /** 是否启用。 */
    @Column(nullable = false)
    public boolean enabled = true;

    /** 使用该邀请码的用户。 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "used_by_user_id")
    public AppUser usedBy;

    /** 使用时间。 */
    public Instant usedAt;

    /** JPA 构造函数。 */
    protected InviteCode() {
    }

    /** 创建邀请码。 */
    public InviteCode(String code) {
        this.code = code;
    }

    /** 判断邀请码是否可使用。 */
    public boolean isAvailable() {
        return enabled && usedBy == null && usedAt == null;
    }
}
