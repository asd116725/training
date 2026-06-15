package com.training.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.training.dto.ApiDtos.MealDayResponse;
import com.training.dto.ApiDtos.MealDayTypeRequest;
import com.training.dto.ApiDtos.MealEntryRequest;
import com.training.model.AppUser;
import com.training.model.CycleType;
import com.training.model.Food;
import com.training.model.MealLog;
import com.training.model.MealLogItem;
import com.training.model.MealType;
import com.training.repository.MealLogItemRepository;
import com.training.repository.MealLogRepository;

/** 餐食记录服务测试。 */
@ExtendWith(MockitoExtension.class)
class MealLogServiceTest {

    /** 餐次仓库。 */
    @Mock
    private MealLogRepository mealLogRepository;

    /** 餐食明细仓库。 */
    @Mock
    private MealLogItemRepository mealLogItemRepository;

    /** 食材服务。 */
    @Mock
    private FoodService foodService;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext = new CurrentUserContext();

    /** 被测餐食服务。 */
    private MealLogService mealLogService;

    /** 当前用户。 */
    private AppUser user;

    /** 测试食材。 */
    private Food food;

    /** 初始化测试上下文。 */
    @BeforeEach
    void setUp() {
        user = new AppUser("13800000000", "hash");
        user.id = 10L;
        food = new Food(user, "米饭", 2.6, 25.9, 0.3, 116);
        food.id = 1L;
        currentUserContext.set(user);
        mealLogService = new MealLogService(mealLogRepository, mealLogItemRepository, foodService,
                new NutritionService(), currentUserContext);
    }

    /** 验证新增餐食保存当天两类计划日型。 */
    @Test
    void shouldSaveDayTypesWhenAddingEntry() {
        LocalDate date = LocalDate.of(2026, 6, 15);
        when(mealLogRepository.findFirstByUserAndLogDateAndMealTypeOrderByIdAsc(user, date, MealType.BREAKFAST))
                .thenReturn(Optional.empty());
        when(mealLogRepository.save(any(MealLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(foodService.getOwnedFood(1L)).thenReturn(food);
        when(mealLogItemRepository.save(any(MealLogItem.class))).thenAnswer(invocation -> {
            MealLogItem item = invocation.getArgument(0);
            item.id = 20L;
            return item;
        });

        mealLogService.addEntry(new MealEntryRequest(date, "breakfast", 1L, 120, "low", "rest"));

        ArgumentCaptor<MealLogItem> captor = ArgumentCaptor.forClass(MealLogItem.class);
        verify(mealLogItemRepository).save(captor.capture());
        assertEquals(CycleType.LOW, captor.getValue().mealLog.cuttingCycleType);
        assertEquals(CycleType.REST, captor.getValue().mealLog.bulkingDayType);
    }

    /** 验证查询某天餐食会返回绑定日型。 */
    @Test
    void shouldReturnMealDayStateWithEntries() {
        LocalDate date = LocalDate.of(2026, 6, 15);
        MealLog mealLog = new MealLog(user, date, MealType.LUNCH);
        mealLog.cuttingCycleType = CycleType.HIGH;
        mealLog.bulkingDayType = CycleType.TRAINING;
        MealLogItem item = new MealLogItem(mealLog, food, 200);
        item.id = 30L;
        when(mealLogItemRepository.findByMealLogUserAndMealLogLogDate(user, date)).thenReturn(List.of(item));

        MealDayResponse response = mealLogService.listByDate(date);

        assertEquals("high", response.cuttingCycleType());
        assertEquals("training", response.bulkingDayType());
        assertEquals(1, response.entries().size());
        assertEquals(30L, response.entries().get(0).id());
    }

    /** 验证切换减脂日型不会覆盖增肌日型。 */
    @Test
    void shouldUpdateOnlyCuttingDayTypeForDate() {
        LocalDate date = LocalDate.of(2026, 6, 15);
        MealLog lunchLog = new MealLog(user, date, MealType.LUNCH);
        lunchLog.cuttingCycleType = CycleType.MEDIUM;
        lunchLog.bulkingDayType = CycleType.REST;
        MealLog dinnerLog = new MealLog(user, date, MealType.DINNER);
        dinnerLog.cuttingCycleType = CycleType.MEDIUM;
        dinnerLog.bulkingDayType = CycleType.REST;
        when(mealLogItemRepository.findByMealLogUserAndMealLogLogDate(user, date))
                .thenReturn(List.of(new MealLogItem(lunchLog, food, 180), new MealLogItem(dinnerLog, food, 120)));

        mealLogService.updateDayType(new MealDayTypeRequest(date, "cutting", "high"));

        assertEquals(CycleType.HIGH, lunchLog.cuttingCycleType);
        assertEquals(CycleType.HIGH, dinnerLog.cuttingCycleType);
        assertEquals(CycleType.REST, lunchLog.bulkingDayType);
        assertEquals(CycleType.REST, dinnerLog.bulkingDayType);
        verify(mealLogRepository).saveAll(List.of(lunchLog, dinnerLog));
    }

    /** 验证空日期切换日型不会创建餐食记录。 */
    @Test
    void shouldNotCreateMealLogWhenUpdatingEmptyDate() {
        LocalDate date = LocalDate.of(2026, 6, 16);
        when(mealLogItemRepository.findByMealLogUserAndMealLogLogDate(user, date)).thenReturn(List.of());

        MealDayResponse response = mealLogService.updateDayType(new MealDayTypeRequest(date, "bulking", "rest"));

        assertEquals("medium", response.cuttingCycleType());
        assertEquals("training", response.bulkingDayType());
        assertEquals(0, response.entries().size());
        verify(mealLogRepository, never()).save(any(MealLog.class));
        verify(mealLogRepository, never()).saveAll(any());
    }
}
