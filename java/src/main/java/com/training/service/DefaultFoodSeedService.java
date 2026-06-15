package com.training.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.training.model.AppUser;
import com.training.model.Food;
import com.training.repository.AppUserRepository;
import com.training.repository.FoodRepository;
import com.training.service.DefaultFoodCatalog.DefaultFood;

/** 默认个人食材补种服务。 */
@Service
@Order(2)
public class DefaultFoodSeedService implements ApplicationRunner {

    /** 用户仓库。 */
    private final AppUserRepository appUserRepository;

    /** 食材仓库。 */
    private final FoodRepository foodRepository;

    /** 创建默认食材补种服务。 */
    public DefaultFoodSeedService(AppUserRepository appUserRepository, FoodRepository foodRepository) {
        this.appUserRepository = appUserRepository;
        this.foodRepository = foodRepository;
    }

    /** 启动后为所有用户补齐默认食材。 */
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        appUserRepository.findAll().forEach(this::seedForUser);
    }

    /** 为指定用户补齐默认食材。 */
    public void seedForUser(AppUser user) {
        for (DefaultFood food : DefaultFoodCatalog.all()) {
            if (!foodRepository.existsByUserAndName(user, food.name())) {
                foodRepository.save(new Food(user, food.name(), food.protein(), food.carbs(), food.fat(),
                        food.calories(), true));
            }
        }
    }

}
