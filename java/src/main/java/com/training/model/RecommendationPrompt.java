package com.training.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/** 推荐提示词实体。 */
@Entity
@Table(name = "recommendation_prompts")
public class RecommendationPrompt {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 所属用户。 */
    @ManyToOne
    @JoinColumn(name = "user_id")
    public AppUser user;

    /** 提示词标题。 */
    @Column(nullable = false, length = 100)
    public String title;

    /** 提示词内容。 */
    @Lob
    @Column(nullable = false)
    public String content;

    /** 展示顺序。 */
    @Column(name = "sort_order")
    public Integer sortOrder;

    /** 创建时间。 */
    public Instant createdAt;

    /** 更新时间。 */
    public Instant updatedAt;

    /** JPA 构造函数。 */
    protected RecommendationPrompt() {
    }

    /** 创建推荐提示词。 */
    public RecommendationPrompt(String title, String content, Integer sortOrder) {
        this(null, title, content, sortOrder);
    }

    /** 创建当前用户推荐提示词。 */
    public RecommendationPrompt(AppUser user, String title, String content, Integer sortOrder) {
        this.user = user;
        this.title = title;
        this.content = content;
        this.sortOrder = sortOrder;
    }

    /** 保存前补充时间。 */
    @PrePersist
    protected void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /** 更新前刷新时间。 */
    @PreUpdate
    protected void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
