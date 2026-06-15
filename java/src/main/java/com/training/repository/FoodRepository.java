package com.training.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.training.model.AppUser;
import com.training.model.Food;

/** 食材仓库。 */
public interface FoodRepository extends JpaRepository<Food, Long> {

    /** 查询用户个人食材。 */
    List<Food> findByUserOrderByIdAsc(AppUser user);

    /** 按用户和名称判断食材是否存在。 */
    boolean existsByUserAndName(AppUser user, String name);

    /** 按用户和主键查询食材。 */
    Optional<Food> findByIdAndUser(Long id, AppUser user);
}
