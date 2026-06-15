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
        Food food = new Food(user, "牛奶", 3.6, 5, 4, 70);
        food.id = 1L;
        when(foodRepository.findByUserOrderByIdAsc(user)).thenReturn(List.of(food));

        List<FoodResponse> foods = foodService.listFoods();

        assertEquals(1, foods.size());
        assertEquals("牛奶", foods.get(0).name());
        assertTrue(foods.get(0).owned());
    }

    /** 验证公共库标记当前用户食材。 */
    @Test
    void shouldMarkOwnedFoodsInPublicList() {
        Food ownedFood = new Food(user, "牛奶", 3.6, 5, 4, 70);
        ownedFood.id = 1L;
        Food publicFood = new Food("虾", 20, 0, 0.5, 85);
        publicFood.id = 2L;
        when(foodRepository.findAll()).thenReturn(List.of(ownedFood, publicFood));

        List<FoodResponse> foods = foodService.listPublicFoods();

        assertTrue(foods.get(0).owned());
        assertFalse(foods.get(1).owned());
    }

    /** 验证公共库隐藏默认补种副本但保留手动食材。 */
    @Test
    void shouldHideDefaultSeedFoodsButKeepManualFoodsInPublicList() {
        AppUser otherUser = new AppUser("13900000000", "hash");
        otherUser.id = 20L;
        Food defaultSeedFood = new Food(otherUser, "牛奶", 3.6, 5, 4, 70);
        defaultSeedFood.id = 1L;
        defaultSeedFood.defaultSeed = true;
        Food manualFood = new Food(otherUser, "牛奶", 4, 5, 4, 75);
        manualFood.id = 2L;
        when(foodRepository.findAll()).thenReturn(List.of(defaultSeedFood, manualFood));

        List<FoodResponse> foods = foodService.listPublicFoods();

        assertEquals(1, foods.size());
        assertEquals(2L, foods.get(0).id());
    }

    /** 验证导入公共食材时复制快照。 */
    @Test
    void shouldCopyPublicFoodWhenImporting() {
        Food source = new Food("虾", 20, 0, 0.5, 85);
        source.id = 2L;
        source.remark = "去壳后称重";
        when(foodRepository.findById(2L)).thenReturn(Optional.of(source));
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
        assertEquals("去壳后称重", response.remark());
        assertEquals(3L, response.id());
        assertTrue(response.owned());
    }

    /** 验证导入自己的食材时直接返回原食材。 */
    @Test
    void shouldReturnOwnedFoodWhenImportingSelf() {
        Food source = new Food(user, "牛奶", 3.6, 5, 4, 70);
        source.id = 1L;
        when(foodRepository.findById(1L)).thenReturn(Optional.of(source));

        FoodResponse response = foodService.importFood(1L);

        assertEquals(1L, response.id());
        assertTrue(response.owned());
    }

    /** 验证新增食材归属当前用户。 */
    @Test
    void shouldCreateFoodForCurrentUser() {
        when(foodRepository.save(any(Food.class))).thenAnswer(invocation -> invocation.getArgument(0));

        foodService.createFood(new FoodRequest("牛肉", 23, 0, 3, 120, "一份约150g"));

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository).save(captor.capture());
        assertSame(user, captor.getValue().user);
        assertEquals("牛肉", captor.getValue().name);
        assertEquals("一份约150g", captor.getValue().remark);
    }

    /** 验证修改食材同步保存备注。 */
    @Test
    void shouldUpdateFoodRemark() {
        Food food = new Food(user, "牛奶馒头", 9, 50, 4, 275);
        food.id = 1L;
        when(foodRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FoodResponse response = foodService.updateFood(1L, new FoodRequest("牛奶馒头", 9, 50, 4, 275, "一个牛奶馒头重30g"));

        assertEquals("一个牛奶馒头重30g", food.remark);
        assertEquals("一个牛奶馒头重30g", response.remark());
    }

    /** 验证不能修改其他用户食材。 */
    @Test
    void shouldReturnNotFoundWhenUpdatingOtherUserFood() {
        when(foodRepository.findByIdAndUser(1L, user)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> foodService.updateFood(1L, new FoodRequest("牛肉", 23, 0, 3, 120, "")));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    /** 验证不能删除其他用户食材。 */
    @Test
    void shouldReturnNotFoundWhenDeletingOtherUserFood() {
        when(foodRepository.findByIdAndUser(1L, user)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> foodService.deleteFood(1L));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }
}
