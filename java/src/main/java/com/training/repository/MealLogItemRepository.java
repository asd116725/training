package com.training.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.training.model.AppUser;
import com.training.model.MealLogItem;

/** 餐次食材明细仓库。 */
public interface MealLogItemRepository extends JpaRepository<MealLogItem, Long> {

    /** 按日期查询餐食明细。 */
    List<MealLogItem> findByMealLogLogDate(LocalDate logDate);

    /** 按用户和日期查询餐食明细。 */
    List<MealLogItem> findByMealLogUserAndMealLogLogDate(AppUser user, LocalDate logDate);
}
