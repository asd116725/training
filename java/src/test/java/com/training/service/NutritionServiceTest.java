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
                        new FoodSnapshot("1", "鸡胸肉", 23, 0, 2, 110),
                        new FoodSnapshot("2", "米饭", 2.6, 25.9, 0.3, 116),
                        new FoodSnapshot("3", "橄榄油", 0, 0, 100, 884)),
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
