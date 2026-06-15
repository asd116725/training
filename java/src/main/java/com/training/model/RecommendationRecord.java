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
import jakarta.persistence.Table;

/** 推荐结果记录实体。 */
@Entity
@Table(name = "recommendation_records")
public class RecommendationRecord {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 所属用户。 */
    @ManyToOne
    @JoinColumn(name = "user_id")
    public AppUser user;

    /** 推荐来源。 */
    public String source;

    /** 推荐摘要。 */
    @Column(length = 1000)
    public String summary;

    /** 推荐内容 JSON。 */
    @Lob
    public String payload;

    /** 创建时间。 */
    public Instant createdAt;

    /** JPA 构造函数。 */
    protected RecommendationRecord() {
    }

    /** 创建推荐记录。 */
    public RecommendationRecord(String source, String summary, String payload) {
        this(null, source, summary, payload);
    }

    /** 创建当前用户推荐记录。 */
    public RecommendationRecord(AppUser user, String source, String summary, String payload) {
        this.user = user;
        this.source = source;
        this.summary = summary;
        this.payload = payload;
        this.createdAt = Instant.now();
    }
}
