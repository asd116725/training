package com.training.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.training.dto.ApiDtos.FoodRequest;
import com.training.dto.ApiDtos.FoodResponse;
import com.training.model.AppUser;
import com.training.model.Food;
import com.training.repository.FoodRepository;

/** 食材服务测试。 */
@ExtendWith(MockitoExtension.class)
class FoodServiceTest {

    /** 食材仓库。 */
    @Mock
    private FoodRepository foodRepository;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext = new CurrentUserContext();

    /** 被测食材服务。 */
    private FoodService foodService;

    /** 当前用户。 */
    private AppUser user;

    /** 初始化测试上下文。 */
    @BeforeEach
    void setUp() {
        user = new AppUser("13800000000", "hash");
        user.id = 10L;
        currentUserContext.set(user);
        foodService = new FoodService(foodRepository, currentUserContext);
    }

    /** 验证只查询当前用户食材。 */
    @Test
    void shouldListCurrentUserFoods() {
        Food food = new Food(user, "牛奶", "瓶", 200, 7.2, 10, 8, 140);
        food.id = 1L;
        when(foodRepository.findByUserAndDeletedFalseOrderByIdAsc(user)).thenReturn(List.of(food));

        List<FoodResponse> foods = foodService.listFoods();

        assertEquals(1, foods.size());
        assertEquals("牛奶", foods.get(0).name());
        assertEquals("瓶", foods.get(0).unitName());
        assertEquals(200, foods.get(0).unitWeight());
        assertTrue(foods.get(0).owned());
    }

    /** 验证公共库标记当前用户食材。 */
    @Test
    void shouldMarkOwnedFoodsInPublicList() {
        Food ownedFood = new Food(user, "牛奶", "瓶", 200, 7.2, 10, 8, 140);
        ownedFood.id = 1L;
        Food publicFood = new Food("虾", 20, 0, 0.5, 85);
        publicFood.id = 2L;
        when(foodRepository.findByDeletedFalseOrderByIdAsc()).thenReturn(List.of(ownedFood, publicFood));

        List<FoodResponse> foods = foodService.listPublicFoods();

        assertTrue(foods.get(0).owned());
        assertFalse(foods.get(1).owned());
    }

    /** 验证公共库隐藏默认补种副本但保留手动食材。 */
    @Test
    void shouldHideDefaultSeedFoodsButKeepManualFoodsInPublicList() {
        AppUser otherUser = new AppUser("13900000000", "hash");
        otherUser.id = 20L;
        Food defaultSeedFood = new Food(otherUser, "牛奶", "克", 1, 3.6, 5, 4, 70);
        defaultSeedFood.id = 1L;
        defaultSeedFood.defaultSeed = true;
        Food manualFood = new Food(otherUser, "牛奶", "瓶", 200, 8, 10, 8, 150);
        manualFood.id = 2L;
        when(foodRepository.findByDeletedFalseOrderByIdAsc()).thenReturn(List.of(defaultSeedFood, manualFood));

        List<FoodResponse> foods = foodService.listPublicFoods();

        assertEquals(1, foods.size());
        assertEquals(2L, foods.get(0).id());
    }

    /** 验证导入公共食材时复制快照。 */
    @Test
    void shouldCopyPublicFoodWhenImporting() {
        Food source = new Food("虾", "份", 120, 24, 0, 0.6, 102);
        source.id = 2L;
        source.remark = "去壳后称重";
        when(foodRepository.findByIdAndDeletedFalse(2L)).thenReturn(Optional.of(source));
        when(foodRepository.save(any(Food.class))).thenAnswer(invocation -> {
            Food savedFood = invocation.getArgument(0);
            savedFood.id = 3L;
            return savedFood;
        });

        FoodResponse response = foodService.importFood(2L);

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository).save(captor.capture());
        assertSame(user, captor.getValue().user);
        assertEquals("虾", response.name());
        assertEquals("份", response.unitName());
        assertEquals(120, response.unitWeight());
        assertEquals("去壳后称重", response.remark());
        assertEquals(3L, response.id());
        assertTrue(response.owned());
    }

    /** 验证导入自己的食材时直接返回原食材。 */
    @Test
    void shouldReturnOwnedFoodWhenImportingSelf() {
        Food source = new Food(user, "牛奶", "瓶", 200, 7.2, 10, 8, 140);
        source.id = 1L;
        when(foodRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(source));

        FoodResponse response = foodService.importFood(1L);

        assertEquals(1L, response.id());
        assertTrue(response.owned());
    }

    /** 验证新增食材归属当前用户。 */
    @Test
    void shouldCreateFoodForCurrentUser() {
        when(foodRepository.save(any(Food.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FoodResponse response = foodService.createFood(new FoodRequest("牛肉", "份", 150, 34.5555, 0, 4.5444, 180.6666,
                "一份约150g"));

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository).save(captor.capture());
        assertSame(user, captor.getValue().user);
        assertEquals("牛肉", captor.getValue().name);
        assertEquals("份", captor.getValue().unitName);
        assertEquals(150, captor.getValue().unitWeight);
        assertEquals(34.556, captor.getValue().protein);
        assertEquals(4.544, captor.getValue().fat);
        assertEquals(180.667, response.calories());
        assertEquals("一份约150g", captor.getValue().remark);
    }

    /** 验证修改食材同步保存单位和备注。 */
    @Test
    void shouldUpdateFoodUnitAndRemark() {
        Food food = new Food(user, "牛奶馒头", "克", 1, 0.09, 0.5, 0.04, 2.75);
        food.id = 1L;
        when(foodRepository.findByIdAndUserAndDeletedFalse(1L, user)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FoodResponse response = foodService.updateFood(1L,
                new FoodRequest("牛奶馒头", "件", 30, 2.7, 15, 1.2, 82.5, "一个牛奶馒头重30g"));

        assertEquals("件", food.unitName);
        assertEquals(30, food.unitWeight);
        assertEquals("一个牛奶馒头重30g", food.remark);
        assertEquals("件", response.unitName());
        assertEquals(30, response.unitWeight());
        assertEquals("一个牛奶馒头重30g", response.remark());
    }

    /** 验证不能修改其他用户食材。 */
    @Test
    void shouldReturnNotFoundWhenUpdatingOtherUserFood() {
        when(foodRepository.findByIdAndUserAndDeletedFalse(1L, user)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> foodService.updateFood(1L, new FoodRequest("牛肉", "克", 1, 23, 0, 3, 120, "")));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    /** 验证不能删除其他用户食材。 */
    @Test
    void shouldReturnNotFoundWhenDeletingOtherUserFood() {
        when(foodRepository.findByIdAndUserAndDeletedFalse(1L, user)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> foodService.deleteFood(1L));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    /** 验证删除食材时使用软删除保留历史记录。 */
    @Test
    void shouldSoftDeleteOwnedFood() {
        Food food = new Food(user, "牛奶", "瓶", 200, 7.2, 10, 8, 140);
        food.id = 1L;
        when(foodRepository.findByIdAndUserAndDeletedFalse(1L, user)).thenReturn(Optional.of(food));

        foodService.deleteFood(1L);

        assertTrue(food.deleted);
        verify(foodRepository).save(food);
    }
}
