package com.training.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.training.dto.ApiDtos.FoodImportRequest;
import com.training.dto.ApiDtos.FoodRequest;
import com.training.dto.ApiDtos.FoodResponse;
import com.training.service.FoodService;

import jakarta.validation.Valid;

/** 食材接口。 */
@Validated
@RestController
@RequestMapping("/api/foods")
public class FoodController {

    /** 食材服务。 */
    private final FoodService foodService;

    /** 创建食材接口。 */
    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    /** 查询食材列表。 */
    @GetMapping
    public List<FoodResponse> listFoods() {
        return foodService.listFoods();
    }

    /** 查询公共食材库。 */
    @GetMapping("/public")
    public List<FoodResponse> listPublicFoods() {
        return foodService.listPublicFoods();
    }

    /** 新增食材。 */
    @PostMapping
    public FoodResponse createFood(@Valid @RequestBody FoodRequest request) {
        return foodService.createFood(request);
    }

    /** 导入公共食材。 */
    @PostMapping("/import")
    public FoodResponse importFood(@Valid @RequestBody FoodImportRequest request) {
        return foodService.importFood(request.foodId());
    }

    /** 修改食材。 */
    @PutMapping("/{id}")
    public FoodResponse updateFood(@PathVariable Long id, @Valid @RequestBody FoodRequest request) {
        return foodService.updateFood(id, request);
    }

    /** 删除食材。 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFood(@PathVariable Long id) {
        foodService.deleteFood(id);
        return ResponseEntity.noContent().build();
    }
}
