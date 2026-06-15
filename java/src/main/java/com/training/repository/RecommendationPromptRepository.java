package com.training.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.training.model.AppUser;
import com.training.model.RecommendationPrompt;

/** 推荐提示词仓库。 */
public interface RecommendationPromptRepository extends JpaRepository<RecommendationPrompt, Long> {

    /** 按当前用户和展示顺序查询。 */
    List<RecommendationPrompt> findAllByUserOrderBySortOrderAscIdAsc(AppUser user);

    /** 查询当前用户最大排序值。 */
    @Query("select coalesce(max(prompt.sortOrder), 0) from RecommendationPrompt prompt where prompt.user = :user")
    int findMaxSortOrderByUser(@Param("user") AppUser user);
}
