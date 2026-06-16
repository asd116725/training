package com.training.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.training.dto.ApiDtos.DailyPlan;
import com.training.dto.ApiDtos.FoodSnapshot;
import com.training.dto.ApiDtos.MealEntrySnapshot;
import com.training.dto.ApiDtos.NutritionTotals;
import com.training.dto.ApiDtos.ProfileRequest;
import com.training.dto.ApiDtos.ProfileSnapshot;
import com.training.dto.ApiDtos.RecommendationRequest;
import com.training.dto.ApiDtos.RecommendedItem;
import com.training.model.CycleType;
import com.training.model.Food;
import com.training.model.Gender;
import com.training.model.MealLogItem;

/** 营养计算服务。 */
@Service
public class NutritionService {

    /** 高碳日热量偏移。 */
    private static final double HIGH_CALORIE_OFFSET = -200;

    /** 中碳日热量偏移。 */
    private static final double MEDIUM_CALORIE_OFFSET = -450;

    /** 低碳日热量偏移。 */
    private static final double LOW_CALORIE_OFFSET = -650;

    /** 增肌训练日每公斤碳水。 */
    private static final double BULKING_TRAINING_CARBS_PER_KG = 5;

    /** 增肌休息日每公斤碳水。 */
    private static final double BULKING_REST_CARBS_PER_KG = 4.7;

    /** 餐次顺序。 */
    private static final List<String> MEAL_TYPES = List.of("breakfast", "lunch", "preWorkout", "postWorkout", "dinner");

    /** 按请求计算每日计划。 */
    public DailyPlan calculateDailyPlan(ProfileRequest profile, String cycleType) {
        return calculateDailyPlan(profile.gender(), profile.height(), profile.weight(), profile.age(), profile.bodyFat(),
                profile.targetBodyFat(), profile.activityLevel(), parseCycleType(cycleType));
    }

    /** 按推荐快照计算每日计划。 */
    public DailyPlan calculateDailyPlan(ProfileSnapshot profile, String cycleType) {
        return calculateDailyPlan(profile.gender(), profile.height(), profile.weight(), profile.age(), profile.bodyFat(),
                profile.targetBodyFat(), profile.activityLevel(), parseCycleType(cycleType));
    }

    /** 计算食材营养。 */
    public NutritionTotals calculateFoodNutrition(Food food, double grams) {
        double ratio = grams / 100;
        double protein = roundOne(food.protein * ratio);
        double carbs = roundOne(food.carbs * ratio);
        double fat = roundOne(food.fat * ratio);
        return new NutritionTotals(calculateMacroCalories(protein, carbs, fat), protein, carbs, fat);
    }

    /** 计算食材快照营养。 */
    public NutritionTotals calculateFoodNutrition(FoodSnapshot food, double grams) {
        double ratio = grams / 100;
        double protein = roundOne(food.protein() * ratio);
        double carbs = roundOne(food.carbs() * ratio);
        double fat = roundOne(food.fat() * ratio);
        return new NutritionTotals(calculateMacroCalories(protein, carbs, fat), protein, carbs, fat);
    }

    /** 汇总餐食明细营养。 */
    public NutritionTotals calculateEntryTotals(List<MealLogItem> items) {
        return items.stream()
                .map(item -> calculateFoodNutrition(item.food, item.grams))
                .reduce(new NutritionTotals(0, 0, 0, 0), this::sum);
    }

    /** 计算剩余营养缺口。 */
    public NutritionTotals calculateRemaining(NutritionTotals target, NutritionTotals consumed) {
        return new NutritionTotals(Math.max(0, roundOne(target.calories() - consumed.calories())),
                Math.max(0, roundOne(target.protein() - consumed.protein())),
                Math.max(0, roundOne(target.carbs() - consumed.carbs())),
                Math.max(0, roundOne(target.fat() - consumed.fat())));
    }

    /** 生成本地规则推荐。 */
    public List<RecommendedItem> createRuleRecommendation(RecommendationRequest request) {
        List<FoodSnapshot> foods = request.foods();
        if (foods == null || foods.isEmpty()) {
            return List.of();
        }

        List<String> meals = getTargetMeals(request);
        if (meals.isEmpty()) {
            return List.of();
        }

        NutritionTotals remaining = request.remaining();
        FoodSnapshot proteinFood = foods.stream().max(Comparator.comparingDouble(food -> macroPerGram(food.protein())))
                .orElse(foods.get(0));
        FoodSnapshot carbFood = foods.stream().max(Comparator.comparingDouble(food -> macroPerGram(food.carbs())))
                .orElse(foods.get(0));
        FoodSnapshot fatFood = foods.stream().max(Comparator.comparingDouble(food -> macroPerGram(food.fat())))
                .orElse(foods.get(0));

        return meals.stream()
                .flatMap(meal -> List.of(
                        buildRecommendation(meal, proteinFood,
                                gramsFor(remaining.protein() / meals.size(), proteinFood.protein())),
                        buildRecommendation(meal, carbFood,
                                gramsFor(remaining.carbs() / meals.size(), carbFood.carbs())),
                        buildRecommendation(meal, fatFood,
                                gramsFor(remaining.fat() / meals.size(), fatFood.fat()))).stream())
                .filter(item -> item.grams() >= 5)
                .toList();
    }

    /** 获取推荐应覆盖的餐次。 */
    public List<String> getTargetMeals(RecommendationRequest request) {
        Map<String, Boolean> skippedMeals = request.skippedMeals() == null ? Map.of() : request.skippedMeals();

        if (request.targetMeals() != null && !request.targetMeals().isEmpty()) {
            return request.targetMeals().stream()
                    .filter(MEAL_TYPES::contains)
                    .filter(meal -> !Boolean.TRUE.equals(skippedMeals.get(meal)))
                    .distinct()
                    .toList();
        }

        List<MealEntrySnapshot> entries = request.entries() == null ? List.of() : request.entries();
        Set<String> usedMeals = entries.stream().map(MealEntrySnapshot::meal).collect(java.util.stream.Collectors.toSet());
        List<String> availableMeals = MEAL_TYPES.stream().filter(meal -> !Boolean.TRUE.equals(skippedMeals.get(meal))).toList();
        List<String> emptyMeals = availableMeals.stream().filter(meal -> !usedMeals.contains(meal)).toList();

        if (!emptyMeals.isEmpty()) {
            return emptyMeals;
        }

        if (availableMeals.contains("dinner")) {
            return List.of("dinner");
        }

        return availableMeals.isEmpty() ? List.of() : List.of(availableMeals.get(availableMeals.size() - 1));
    }

    /** 解析性别。 */
    public Gender parseGender(String value) {
        return "female".equalsIgnoreCase(value) || "FEMALE".equalsIgnoreCase(value) ? Gender.FEMALE : Gender.MALE;
    }

    /** 解析碳循环类型。 */
    public CycleType parseCycleType(String value) {
        if ("high".equalsIgnoreCase(value) || "HIGH".equalsIgnoreCase(value)) {
            return CycleType.HIGH;
        }
        if ("low".equalsIgnoreCase(value) || "LOW".equalsIgnoreCase(value)) {
            return CycleType.LOW;
        }
        if ("training".equalsIgnoreCase(value) || "TRAINING".equalsIgnoreCase(value)) {
            return CycleType.TRAINING;
        }
        if ("rest".equalsIgnoreCase(value) || "REST".equalsIgnoreCase(value)) {
            return CycleType.REST;
        }
        return CycleType.MEDIUM;
    }

    /** 计算每日计划。 */
    private DailyPlan calculateDailyPlan(String gender, double height, double weight, int age, double bodyFat,
            double targetBodyFat, double activityLevel, CycleType cycleType) {
        double genderOffset = parseGender(gender) == Gender.MALE ? 5 : -161;
        double bmr = 10 * weight + 6.25 * height - 5 * age + genderOffset;
        double tdee = bmr * activityLevel;
        double leanMass = weight * (1 - bodyFat / 100);
        double targetWeight = leanMass / (1 - targetBodyFat / 100);
        double fatToLose = Math.max(0, weight - targetWeight);
        double calories = Math.max(1300, tdee + calorieOffset(cycleType));
        double protein = weight * 2;
        double fat = weight * fatPerKg(cycleType);
        double carbs = isBulkingType(cycleType)
                ? weight * carbsPerKg(cycleType)
                : Math.max(0, (calories - protein * 4 - fat * 9) / 4);
        calories = isBulkingType(cycleType) ? carbs * 4 + protein * 4 + fat * 9 : calories;

        return new DailyPlan(Math.round(bmr), Math.round(tdee), Math.round(calories), Math.round(protein),
                Math.round(carbs), Math.round(fat), roundOne(targetWeight), roundOne(fatToLose));
    }

    /** 汇总两个营养素对象。 */
    private NutritionTotals sum(NutritionTotals left, NutritionTotals right) {
        double protein = roundOne(left.protein() + right.protein());
        double carbs = roundOne(left.carbs() + right.carbs());
        double fat = roundOne(left.fat() + right.fat());
        return new NutritionTotals(calculateMacroCalories(protein, carbs, fat), protein, carbs, fat);
    }

    /** 按宏量营养素换算热量。 */
    private double calculateMacroCalories(double protein, double carbs, double fat) {
        return roundOne(protein * 4 + carbs * 4 + fat * 9);
    }

    /** 获取热量偏移。 */
    private double calorieOffset(CycleType cycleType) {
        return switch (cycleType) {
            case HIGH -> HIGH_CALORIE_OFFSET;
            case LOW -> LOW_CALORIE_OFFSET;
            default -> MEDIUM_CALORIE_OFFSET;
        };
    }

    /** 判断是否为增肌日型。 */
    private boolean isBulkingType(CycleType cycleType) {
        return cycleType == CycleType.TRAINING || cycleType == CycleType.REST;
    }

    /** 获取每公斤碳水克数。 */
    private double carbsPerKg(CycleType cycleType) {
        return switch (cycleType) {
            case TRAINING -> BULKING_TRAINING_CARBS_PER_KG;
            case REST -> BULKING_REST_CARBS_PER_KG;
            default -> 0;
        };
    }

    /** 获取每公斤脂肪克数。 */
    private double fatPerKg(CycleType cycleType) {
        return switch (cycleType) {
            case HIGH -> 0.62;
            case LOW -> 0.9;
            case TRAINING, REST -> 1;
            default -> 0.75;
        };
    }

    /** 根据营养缺口换算克数。 */
    private double gramsFor(double targetMacro, double foodMacroPer100g) {
        return foodMacroPer100g <= 0 ? 0 : Math.round(((targetMacro / foodMacroPer100g) * 100) / 5) * 5;
    }

    /** 计算每百克营养密度。 */
    private double macroPerGram(double macroPer100g) {
        return macroPer100g;
    }

    /** 组装推荐项。 */
    private RecommendedItem buildRecommendation(String meal, FoodSnapshot food, double grams) {
        double safeGrams = Math.min(320, Math.max(0, grams));
        NutritionTotals nutrition = calculateFoodNutrition(food, safeGrams);
        return new RecommendedItem(meal, food.name(), safeGrams, nutrition.calories(), nutrition.protein(),
                nutrition.carbs(), nutrition.fat());
    }

    /** 保留一位小数。 */
    private double roundOne(double value) {
        return Math.round(value * 10) / 10.0;
    }
}
