package com.training.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.training.dto.ApiDtos.DailyPlan;
import com.training.dto.ApiDtos.FoodSnapshot;
import com.training.dto.ApiDtos.MealEntrySnapshot;
import com.training.dto.ApiDtos.NutritionTotals;
import com.training.dto.ApiDtos.ProfileRequest;
import com.training.dto.ApiDtos.ProfileSnapshot;
import com.training.dto.ApiDtos.RecommendationRequest;
import com.training.dto.ApiDtos.RecommendedItem;
import com.training.model.AppUser;
import com.training.model.Food;

/** 营养计算服务测试。 */
class NutritionServiceTest {

    /** 被测营养服务。 */
    private final NutritionService nutritionService = new NutritionService();

    /** 验证每日目标计算。 */
    @Test
    void shouldCalculateDailyPlan() {
        ProfileRequest profile = new ProfileRequest("male", 175, 78, 30, 22, 15, 1.55);

        DailyPlan plan = nutritionService.calculateDailyPlan(profile, "medium");

        assertEquals(156, plan.protein());
        assertTrue(plan.calories() > 1900);
        assertTrue(plan.targetWeight() < 78);
    }

    /** 验证增肌日目标热量跟随宏量配置换算。 */
    @Test
    void shouldCalculateBulkingPlanFromMacroSettings() {
        ProfileRequest profile = new ProfileRequest("male", 175, 78, 30, 22, 15, 1.55);

        DailyPlan trainingPlan = nutritionService.calculateDailyPlan(profile, "training");
        DailyPlan restPlan = nutritionService.calculateDailyPlan(profile, "rest");

        assertEquals(390, trainingPlan.carbs());
        assertEquals(78, trainingPlan.fat());
        assertEquals(trainingPlan.carbs() * 4 + trainingPlan.protein() * 4 + trainingPlan.fat() * 9,
                trainingPlan.calories());
        assertTrue(trainingPlan.calories() > trainingPlan.tdee());
        assertTrue(restPlan.calories() > restPlan.tdee());
        assertTrue(trainingPlan.calories() > restPlan.calories());
    }

    /** 验证剩余营养缺口。 */
    @Test
    void shouldCalculateRemaining() {
        NutritionTotals target = new NutritionTotals(2200, 160, 240, 65);
        NutritionTotals consumed = new NutritionTotals(800, 60, 90, 20);

        NutritionTotals remaining = nutritionService.calculateRemaining(target, consumed);

        assertEquals(1400, remaining.calories());
        assertEquals(100, remaining.protein());
        assertEquals(150, remaining.carbs());
        assertEquals(45, remaining.fat());
    }

    /** 验证按食材单位重量换算实际克重营养。 */
    @Test
    void shouldCalculateFoodNutritionByUnitWeight() {
        Food milk = new Food(new AppUser("13800000000", "hash"), "牛奶", "瓶", 200, 7.2, 10, 8, 140);

        NutritionTotals nutrition = nutritionService.calculateFoodNutrition(milk, 400);

        assertEquals(280, nutrition.calories());
        assertEquals(14.4, nutrition.protein());
        assertEquals(20, nutrition.carbs());
        assertEquals(16, nutrition.fat());
    }

    /** 验证规则推荐生成。 */
    @Test
    void shouldCreateRuleRecommendation() {
        RecommendationRequest request = new RecommendationRequest(
                new ProfileSnapshot("male", 175, 78, 30, 22, 15, 1.55),
                "medium",
                "",
                new DailyPlan(1700, 2600, 2150, 156, 230, 58, 71.6, 6.4),
                new NutritionTotals(900, 70, 90, 20),
                new NutritionTotals(1250, 86, 140, 38),
                List.of(
                        new FoodSnapshot("1", "鸡胸肉", "克", 1, 0.23, 0, 0.02, 1.1),
                        new FoodSnapshot("2", "米饭", "克", 1, 0.026, 0.259, 0.003, 1.16),
                        new FoodSnapshot("3", "橄榄油", "克", 1, 0, 0, 1, 8.84)),
                List.of(new MealEntrySnapshot("a", "breakfast", "2", 200)),
                Map.of(),
                List.of());

        List<RecommendedItem> items = nutritionService.createRuleRecommendation(request);

        assertFalse(items.isEmpty());
        assertTrue(items.stream().anyMatch(item -> "鸡胸肉".equals(item.foodName())));
    }

    /** 验证显式推荐餐次会过滤跳过和无效餐次。 */
    @Test
    void shouldFilterExplicitTargetMeals() {
        RecommendationRequest request = new RecommendationRequest(
                null,
                "medium",
                "",
                null,
                null,
                null,
                List.of(),
                List.of(),
                Map.of("dinner", true),
                List.of("dinner", "postWorkout", "unknown", "postWorkout"));

        assertEquals(List.of("postWorkout"), nutritionService.getTargetMeals(request));
    }
}
