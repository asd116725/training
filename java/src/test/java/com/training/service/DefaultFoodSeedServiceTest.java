package com.training.service;

import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.training.model.AppUser;
import com.training.model.Food;
import com.training.repository.AppUserRepository;
import com.training.repository.FoodRepository;

/** 默认食材补种服务测试。 */
@ExtendWith(MockitoExtension.class)
class DefaultFoodSeedServiceTest {

    /** 用户仓库。 */
    @Mock
    private AppUserRepository appUserRepository;

    /** 食材仓库。 */
    @Mock
    private FoodRepository foodRepository;

    /** 验证默认食材按缺失项补种。 */
    @Test
    void shouldSeedMissingDefaultFoods() {
        AppUser user = new AppUser("13800000000", "hash");
        DefaultFoodSeedService service = new DefaultFoodSeedService(appUserRepository, foodRepository);

        service.seedForUser(user);

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository, times(7)).save(captor.capture());
        List<Food> foods = captor.getAllValues();
        foods.forEach(food -> assertTrue(food.defaultSeed));
    }

    /** 验证已有默认食材不会重复补种。 */
    @Test
    void shouldSkipExistingDefaultFoods() {
        AppUser user = new AppUser("13800000000", "hash");
        DefaultFoodSeedService service = new DefaultFoodSeedService(appUserRepository, foodRepository);
        when(foodRepository.existsByUserAndName(any(AppUser.class), any(String.class))).thenReturn(true);

        service.seedForUser(user);

        verify(foodRepository, never()).save(any(Food.class));
    }
}
