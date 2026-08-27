package com.training.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.training.model.AppUser;
import com.training.model.Food;

/** 食材仓库。 */
public interface FoodRepository extends JpaRepository<Food, Long> {

    /** 查询用户个人食材。 */
    List<Food> findByUserAndDeletedFalseOrderByIdAsc(AppUser user);

    /** 查询未删除食材。 */
    List<Food> findByDeletedFalseOrderByIdAsc();

    /** 按用户和名称判断食材是否存在。 */
    boolean existsByUserAndName(AppUser user, String name);

    /** 按主键查询未删除食材。 */
    Optional<Food> findByIdAndDeletedFalse(Long id);

    /** 按用户和主键查询食材。 */
    Optional<Food> findByIdAndUserAndDeletedFalse(Long id, AppUser user);
}
