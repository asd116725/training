package com.training.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.training.dto.ApiDtos.MealDayResponse;
import com.training.dto.ApiDtos.MealDayTypeRequest;
import com.training.dto.ApiDtos.MealEntryRequest;
import com.training.dto.ApiDtos.MealEntryResponse;
import com.training.dto.ApiDtos.MealFoodUsageResponse;
import com.training.dto.ApiDtos.NutritionTotals;
import com.training.model.AppUser;
import com.training.model.CycleType;
import com.training.model.Food;
import com.training.model.MealLog;
import com.training.model.MealLogItem;
import com.training.model.MealType;
import com.training.repository.MealLogItemRepository;
import com.training.repository.MealLogRepository;

/** 餐食记录业务服务。 */
@Service
public class MealLogService {

    /** 默认减脂日型。 */
    private static final CycleType DEFAULT_CUTTING_CYCLE_TYPE = CycleType.MEDIUM;

    /** 默认增肌日型。 */
    private static final CycleType DEFAULT_BULKING_DAY_TYPE = CycleType.TRAINING;

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
    public MealDayResponse listByDate(LocalDate date) {
        return toMealDayResponse(mealLogItemRepository.findByMealLogUserAndMealLogLogDate(currentUserContext.get(), date));
    }

    /** 查询当前用户食材历史使用次数。 */
    public List<MealFoodUsageResponse> listFoodUsage() {
        return mealLogItemRepository.countFoodUsageByUser(currentUserContext.get()).stream()
                .map(usage -> new MealFoodUsageResponse(usage.getFoodId(), usage.getCount()))
                .toList();
    }

    /** 添加餐食明细。 */
    public MealEntryResponse addEntry(MealEntryRequest request) {
        MealType mealType = parseMealType(request.mealType());
        MealLog mealLog = getOrCreateMealLog(currentUserContext.get(), request.date(), mealType);
        applyDayTypes(mealLog, request);
        mealLogRepository.save(mealLog);
        Food food = foodService.getOwnedFood(request.foodId());
        return toResponse(mealLogItemRepository.save(new MealLogItem(mealLog, food, request.quantity())));
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
        applyDayTypes(item.mealLog, request);
        mealLogRepository.save(item.mealLog);
        item.food = foodService.getOwnedFood(request.foodId());
        item.quantity = request.quantity();
        item.unitName = item.food.unitName;
        item.grams = request.quantity() * item.food.unitWeight;
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

    /** 更新某天已有餐食绑定的计划日型。 */
    public MealDayResponse updateDayType(MealDayTypeRequest request) {
        List<MealLogItem> items = mealLogItemRepository.findByMealLogUserAndMealLogLogDate(currentUserContext.get(),
                request.date());
        List<MealLog> mealLogs = items.stream().map(item -> item.mealLog).distinct().toList();

        if (mealLogs.isEmpty()) {
            return toMealDayResponse(items);
        }

        if ("bulking".equalsIgnoreCase(request.planType())) {
            CycleType dayType = parseBulkingDayType(request.dayType());
            mealLogs.forEach(mealLog -> mealLog.bulkingDayType = dayType);
        } else {
            CycleType cycleType = parseCuttingCycleType(request.dayType());
            mealLogs.forEach(mealLog -> mealLog.cuttingCycleType = cycleType);
        }

        mealLogRepository.saveAll(mealLogs);
        return toMealDayResponse(items);
    }

    /** 获取或创建某天某餐次。 */
    private MealLog getOrCreateMealLog(AppUser user, LocalDate date, MealType mealType) {
        return mealLogRepository.findFirstByUserAndLogDateAndMealTypeOrderByIdAsc(user, date, mealType)
                .orElseGet(() -> mealLogRepository.save(new MealLog(user, date, mealType)));
    }

    /** 写入餐食记录绑定日型。 */
    private void applyDayTypes(MealLog mealLog, MealEntryRequest request) {
        mealLog.cuttingCycleType = parseCuttingCycleType(request.cuttingCycleType());
        mealLog.bulkingDayType = parseBulkingDayType(request.bulkingDayType());
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

    /** 解析减脂日型。 */
    private CycleType parseCuttingCycleType(String value) {
        if ("high".equalsIgnoreCase(value) || "HIGH".equalsIgnoreCase(value)) {
            return CycleType.HIGH;
        }
        if ("low".equalsIgnoreCase(value) || "LOW".equalsIgnoreCase(value)) {
            return CycleType.LOW;
        }
        return DEFAULT_CUTTING_CYCLE_TYPE;
    }

    /** 解析增肌日型。 */
    private CycleType parseBulkingDayType(String value) {
        return "rest".equalsIgnoreCase(value) || "REST".equalsIgnoreCase(value)
                ? CycleType.REST
                : DEFAULT_BULKING_DAY_TYPE;
    }

    /** 转换为前端日型值。 */
    private String toClientDayType(CycleType cycleType) {
        return switch (cycleType) {
            case HIGH -> "high";
            case LOW -> "low";
            case TRAINING -> "training";
            case REST -> "rest";
            default -> "medium";
        };
    }

    /** 转换单日餐食响应。 */
    private MealDayResponse toMealDayResponse(List<MealLogItem> items) {
        CycleType cuttingCycleType = items.stream()
                .map(item -> item.mealLog.cuttingCycleType)
                .findFirst()
                .orElse(DEFAULT_CUTTING_CYCLE_TYPE);
        CycleType bulkingDayType = items.stream()
                .map(item -> item.mealLog.bulkingDayType)
                .findFirst()
                .orElse(DEFAULT_BULKING_DAY_TYPE);

        return new MealDayResponse(items.stream().map(this::toResponse).toList(), toClientDayType(cuttingCycleType),
                toClientDayType(bulkingDayType));
    }

    /** 转换餐食响应。 */
    private MealEntryResponse toResponse(MealLogItem item) {
        NutritionTotals nutrition = nutritionService.calculateFoodNutrition(item.food, item.grams);
        return new MealEntryResponse(item.id, item.mealLog.logDate, item.mealLog.mealType.name(), item.food.id,
                item.food.name, item.quantity, item.unitName, item.grams, nutrition.calories(), nutrition.protein(), nutrition.carbs(),
                nutrition.fat());
    }
}
