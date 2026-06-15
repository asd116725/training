package com.training.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.training.dto.ApiDtos.MealEntryRequest;
import com.training.dto.ApiDtos.MealEntryResponse;
import com.training.dto.ApiDtos.NutritionTotals;
import com.training.model.AppUser;
import com.training.model.Food;
import com.training.model.MealLog;
import com.training.model.MealLogItem;
import com.training.model.MealType;
import com.training.repository.MealLogItemRepository;
import com.training.repository.MealLogRepository;

/** 餐食记录业务服务。 */
@Service
public class MealLogService {

    /** 餐次仓库。 */
    private final MealLogRepository mealLogRepository;

    /** 餐食明细仓库。 */
    private final MealLogItemRepository mealLogItemRepository;

    /** 食材服务。 */
    private final FoodService foodService;

    /** 营养计算服务。 */
    private final NutritionService nutritionService;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext;

    /** 创建餐食记录服务。 */
    public MealLogService(MealLogRepository mealLogRepository, MealLogItemRepository mealLogItemRepository,
            FoodService foodService, NutritionService nutritionService, CurrentUserContext currentUserContext) {
        this.mealLogRepository = mealLogRepository;
        this.mealLogItemRepository = mealLogItemRepository;
        this.foodService = foodService;
        this.nutritionService = nutritionService;
        this.currentUserContext = currentUserContext;
    }

    /** 查询某天餐食。 */
    public List<MealEntryResponse> listByDate(LocalDate date) {
        return mealLogItemRepository.findByMealLogUserAndMealLogLogDate(currentUserContext.get(), date).stream()
                .map(this::toResponse).toList();
    }

    /** 添加餐食明细。 */
    public MealEntryResponse addEntry(MealEntryRequest request) {
        MealType mealType = parseMealType(request.mealType());
        MealLog mealLog = getOrCreateMealLog(currentUserContext.get(), request.date(), mealType);
        Food food = foodService.getOwnedFood(request.foodId());
        return toResponse(mealLogItemRepository.save(new MealLogItem(mealLog, food, request.grams())));
    }

    /** 批量添加餐食明细。 */
    @Transactional
    public List<MealEntryResponse> addEntries(List<MealEntryRequest> requests) {
        return requests.stream().map(this::addEntry).toList();
    }

    /** 修改餐食明细。 */
    public MealEntryResponse updateEntry(Long id, MealEntryRequest request) {
        MealLogItem item = getEntry(id);
        MealType mealType = parseMealType(request.mealType());
        item.mealLog = getOrCreateMealLog(currentUserContext.get(), request.date(), mealType);
        item.food = foodService.getOwnedFood(request.foodId());
        item.grams = request.grams();
        return toResponse(mealLogItemRepository.save(item));
    }

    /** 删除餐食明细。 */
    public void deleteEntry(Long id) {
        mealLogItemRepository.delete(getEntry(id));
    }

    /** 清空某天餐食明细。 */
    public void clearByDate(LocalDate date) {
        mealLogItemRepository.deleteAll(mealLogItemRepository.findByMealLogUserAndMealLogLogDate(currentUserContext.get(), date));
    }

    /** 获取或创建某天某餐次。 */
    private MealLog getOrCreateMealLog(AppUser user, LocalDate date, MealType mealType) {
        return mealLogRepository.findFirstByUserAndLogDateAndMealTypeOrderByIdAsc(user, date, mealType)
                .orElseGet(() -> mealLogRepository.save(new MealLog(user, date, mealType)));
    }

    /** 查询餐食明细。 */
    private MealLogItem getEntry(Long id) {
        AppUser user = currentUserContext.get();
        MealLogItem item = mealLogItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "餐食明细不存在"));

        if (item.mealLog.user == null || !item.mealLog.user.id.equals(user.id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "餐食明细不存在");
        }

        return item;
    }

    /** 解析餐次。 */
    private MealType parseMealType(String value) {
        return switch (value) {
            case "breakfast", "BREAKFAST" -> MealType.BREAKFAST;
            case "lunch", "LUNCH" -> MealType.LUNCH;
            case "preWorkout", "PRE_WORKOUT" -> MealType.PRE_WORKOUT;
            case "postWorkout", "POST_WORKOUT" -> MealType.POST_WORKOUT;
            case "dinner", "DINNER" -> MealType.DINNER;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "餐次类型不正确");
        };
    }

    /** 转换餐食响应。 */
    private MealEntryResponse toResponse(MealLogItem item) {
        NutritionTotals nutrition = nutritionService.calculateFoodNutrition(item.food, item.grams);
        return new MealEntryResponse(item.id, item.mealLog.logDate, item.mealLog.mealType.name(), item.food.id,
                item.food.name, item.grams, nutrition.calories(), nutrition.protein(), nutrition.carbs(),
                nutrition.fat());
    }
}
