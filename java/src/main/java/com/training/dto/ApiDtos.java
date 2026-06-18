package com.training.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;

/** REST 接口 DTO 集合。 */
public final class ApiDtos {

    /** 工具类构造函数。 */
    private ApiDtos() {
    }

    /** 注册请求。 */
    public record AuthRegisterRequest(
            @NotBlank @Pattern(regexp = "^1[3-9]\\d{9}$") String phone,
            @NotBlank @Size(min = 6) String password,
            @NotBlank String inviteCode) {
    }

    /** 登录请求。 */
    public record AuthLoginRequest(
            @NotBlank @Pattern(regexp = "^1[3-9]\\d{9}$") String phone,
            @NotBlank @Size(min = 6) String password) {
    }

    /** 登录用户响应。 */
    public record AuthUserResponse(Long id, String phone) {
    }

    /** 登录响应。 */
    public record AuthResponse(String token, AuthUserResponse user) {
    }

    /** 个人档案请求。 */
    public record ProfileRequest(
            @NotBlank String gender,
            @Positive double height,
            @Positive double weight,
            @Positive int age,
            @PositiveOrZero double bodyFat,
            @PositiveOrZero double targetBodyFat,
            @Positive double activityLevel) {
    }

    /** 个人档案响应。 */
    public record ProfileResponse(
            Long id,
            String gender,
            double height,
            double weight,
            int age,
            double bodyFat,
            double targetBodyFat,
            double activityLevel) {
    }

    /** 个人档案初始化状态响应。 */
    public record ProfileStatusResponse(boolean initialized, ProfileResponse profile) {
    }

    /** 食材请求。 */
    public record FoodRequest(
            @NotBlank String name,
            @NotBlank @Size(max = 20) String unitName,
            @Positive double unitWeight,
            @PositiveOrZero double protein,
            @PositiveOrZero double carbs,
            @PositiveOrZero double fat,
            @PositiveOrZero double calories,
            @Size(max = 255) String remark) {
        /** 规范化备注。 */
        public FoodRequest {
            unitName = unitName == null ? "克" : unitName.trim();
            remark = remark == null ? "" : remark.trim();
        }
    }

    /** 食材导入请求。 */
    public record FoodImportRequest(@NotNull Long foodId) {
    }

    /** 食材响应。 */
    public record FoodResponse(Long id, String name, String unitName, double unitWeight, double protein, double carbs,
            double fat, double calories, String remark, boolean owned) {
    }

    /** 推荐提示词请求。 */
    public record RecommendationPromptRequest(
            @NotBlank String title,
            @NotBlank String content) {
    }

    /** 推荐提示词排序请求。 */
    public record RecommendationPromptOrderRequest(@NotNull List<Long> ids) {
    }

    /** 推荐提示词响应。 */
    public record RecommendationPromptResponse(Long id, String title, String content, int sortOrder) {
    }

    /** 餐食明细请求。 */
    public record MealEntryRequest(
            @NotNull LocalDate date,
            @NotBlank String mealType,
            @NotNull Long foodId,
            @Positive double quantity,
            String cuttingCycleType,
            String bulkingDayType) {
    }

    /** 批量餐食明细请求。 */
    public record MealEntryBatchRequest(@Valid @NotNull List<MealEntryRequest> items) {
    }

    /** 餐食日型切换请求。 */
    public record MealDayTypeRequest(
            @NotNull LocalDate date,
            @NotBlank String planType,
            @NotBlank String dayType) {
    }

    /** 单日餐食响应。 */
    public record MealDayResponse(
            List<MealEntryResponse> entries,
            String cuttingCycleType,
            String bulkingDayType) {
    }

    /** 餐食明细响应。 */
    public record MealEntryResponse(
            Long id,
            LocalDate date,
            String mealType,
            Long foodId,
            String foodName,
            double quantity,
            String unitName,
            double grams,
            double calories,
            double protein,
            double carbs,
            double fat) {
    }

    /** 食材历史使用次数响应。 */
    public record MealFoodUsageResponse(Long foodId, long count) {
    }

    /** 营养素合计。 */
    public record NutritionTotals(double calories, double protein, double carbs, double fat) {
    }

    /** 每日饮食目标。 */
    public record DailyPlan(
            double bmr,
            double tdee,
            double calories,
            double protein,
            double carbs,
            double fat,
            double targetWeight,
            double fatToLose) {
    }

    /** 单日每公斤体重宏量配置请求。 */
    public record CycleMacroSettingRequest(
            @PositiveOrZero double carbsPerKg,
            @PositiveOrZero double proteinPerKg,
            @PositiveOrZero double fatPerKg) {
    }

    /** 碳循环每公斤体重宏量配置请求。 */
    public record CycleMacroSettingsRequest(
            @Valid @NotNull CycleMacroSettingRequest high,
            @Valid @NotNull CycleMacroSettingRequest medium,
            @Valid @NotNull CycleMacroSettingRequest low) {
    }

    /** 单日每公斤体重宏量配置响应。 */
    public record CycleMacroSettingResponse(double carbsPerKg, double proteinPerKg, double fatPerKg) {
    }

    /** 碳循环每公斤体重宏量配置响应。 */
    public record CycleMacroSettingsResponse(
            CycleMacroSettingResponse high,
            CycleMacroSettingResponse medium,
            CycleMacroSettingResponse low) {
    }

    /** 推荐请求中的个人信息快照。 */
    public record ProfileSnapshot(
            String gender,
            double height,
            double weight,
            int age,
            double bodyFat,
            double targetBodyFat,
            double activityLevel) {
    }

    /** 推荐请求中的食材快照。 */
    public record FoodSnapshot(String id, String name, String unitName, double unitWeight, double protein, double carbs,
            double fat, double calories) {
    }

    /** 推荐请求中的餐食快照。 */
    public record MealEntrySnapshot(String id, String meal, String foodId, double grams) {
    }

    /** 推荐请求。 */
    public record RecommendationRequest(
            ProfileSnapshot profile,
            String cycleType,
            String customRequirement,
            DailyPlan dailyPlan,
            NutritionTotals consumed,
            NutritionTotals remaining,
            List<FoodSnapshot> foods,
            List<MealEntrySnapshot> entries,
            Map<String, Boolean> skippedMeals,
            List<String> targetMeals) {
    }

    /** 推荐食材明细。 */
    public record RecommendedItem(
            String meal,
            String foodName,
            double grams,
            double calories,
            double protein,
            double carbs,
            double fat) {
    }

    /** 推荐响应。 */
    public record RecommendationResponse(String source, String summary, List<RecommendedItem> items) {
    }
}
