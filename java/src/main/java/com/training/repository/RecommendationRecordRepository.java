package com.training.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.training.model.RecommendationRecord;

/** 推荐记录仓库。 */
public interface RecommendationRecordRepository extends JpaRepository<RecommendationRecord, Long> {
}
