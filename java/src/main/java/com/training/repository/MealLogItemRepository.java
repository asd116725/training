package com.training.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.training.model.AppUser;
import com.training.model.MealLogItem;

/** 餐次食材明细仓库。 */
public interface MealLogItemRepository extends JpaRepository<MealLogItem, Long> {

    /** 按日期查询餐食明细。 */
    List<MealLogItem> findByMealLogLogDate(LocalDate logDate);

    /** 按用户和日期查询餐食明细。 */
    List<MealLogItem> findByMealLogUserAndMealLogLogDate(AppUser user, LocalDate logDate);

    /** 按用户统计食材历史使用次数。 */
    @Query("""
            SELECT item.food.id AS foodId, COUNT(item.id) AS count
            FROM MealLogItem item
            WHERE item.mealLog.user = :user
            GROUP BY item.food.id
            ORDER BY COUNT(item.id) DESC
            """)
    List<FoodUsageCount> countFoodUsageByUser(@Param("user") AppUser user);

    /** 食材使用次数投影。 */
    interface FoodUsageCount {

        /** 食材主键。 */
        Long getFoodId();

        /** 使用次数。 */
        Long getCount();
    }
}
