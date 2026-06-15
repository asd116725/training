package com.training.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.training.model.AppUser;
import com.training.model.MealLog;
import com.training.model.MealType;

/** 餐次记录仓库。 */
public interface MealLogRepository extends JpaRepository<MealLog, Long> {

    /** 按用户、日期和餐次查询第一条记录。 */
    Optional<MealLog> findFirstByUserAndLogDateAndMealTypeOrderByIdAsc(AppUser user, LocalDate logDate,
            MealType mealType);
}
