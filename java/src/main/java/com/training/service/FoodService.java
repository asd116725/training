package com.training.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.training.dto.ApiDtos.FoodRequest;
import com.training.dto.ApiDtos.FoodResponse;
import com.training.model.AppUser;
import com.training.model.Food;
import com.training.repository.FoodRepository;

/** 食材业务服务。 */
@Service
public class FoodService {

    /** 食材仓库。 */
    private final FoodRepository foodRepository;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext;

    /** 创建食材服务。 */
    public FoodService(FoodRepository foodRepository, CurrentUserContext currentUserContext) {
        this.foodRepository = foodRepository;
        this.currentUserContext = currentUserContext;
    }

    /** 查询当前用户食材。 */
    public List<FoodResponse> listFoods() {
        AppUser user = currentUserContext.get();
        return foodRepository.findByUserOrderByIdAsc(user).stream().map(food -> toResponse(food, true)).toList();
    }

    /** 查询公共食材库。 */
    public List<FoodResponse> listPublicFoods() {
        AppUser user = currentUserContext.get();
        return foodRepository.findAll().stream()
                .filter(food -> !food.defaultSeed)
                .map(food -> toResponse(food, isOwnedBy(food, user)))
                .toList();
    }

    /** 新增食材。 */
    public FoodResponse createFood(FoodRequest request) {
        AppUser user = currentUserContext.get();
        Food food = foodRepository.save(new Food(user, request.name(), request.unitName(), request.unitWeight(),
                roundThree(request.protein()), roundThree(request.carbs()), roundThree(request.fat()),
                roundThree(request.calories()), request.remark()));
        return toResponse(food, true);
    }

    /** 导入公共食材。 */
    public FoodResponse importFood(Long id) {
        AppUser user = currentUserContext.get();
        Food source = getFood(id);

        if (isOwnedBy(source, user)) {
            return toResponse(source, true);
        }

        Food food = foodRepository.save(new Food(user, source.name, source.unitName, source.unitWeight,
                roundThree(source.protein), roundThree(source.carbs), roundThree(source.fat),
                roundThree(source.calories), source.remark));
        return toResponse(food, true);
    }

    /** 修改食材。 */
    public FoodResponse updateFood(Long id, FoodRequest request) {
        Food food = getOwnedFood(id);
        food.name = request.name();
        food.unitName = request.unitName();
        food.unitWeight = request.unitWeight();
        food.protein = roundThree(request.protein());
        food.carbs = roundThree(request.carbs());
        food.fat = roundThree(request.fat());
        food.calories = roundThree(request.calories());
        food.remark = request.remark();
        return toResponse(foodRepository.save(food), true);
    }

    /** 删除食材。 */
    public void deleteFood(Long id) {
        foodRepository.delete(getOwnedFood(id));
    }

    /** 查询当前用户食材。 */
    public Food getOwnedFood(Long id) {
        return foodRepository.findByIdAndUser(id, currentUserContext.get())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "食材不存在"));
    }

    /** 按主键查询食材。 */
    public Food getFood(Long id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "食材不存在"));
    }

    /** 判断食材是否属于当前用户。 */
    private boolean isOwnedBy(Food food, AppUser user) {
        return food.user != null && food.user.id != null && food.user.id.equals(user.id);
    }

    /** 转换食材响应。 */
    private FoodResponse toResponse(Food food, boolean owned) {
        return new FoodResponse(food.id, food.name, food.unitName, food.unitWeight, roundThree(food.protein),
                roundThree(food.carbs), roundThree(food.fat), roundThree(food.calories),
                food.remark == null ? "" : food.remark, owned);
    }

    /** 保留三位小数。 */
    private double roundThree(double value) {
        return Math.round(value * 1000) / 1000.0;
    }
}
