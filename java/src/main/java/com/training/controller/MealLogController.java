package com.training.controller;

import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.training.dto.ApiDtos.MealDayResponse;
import com.training.dto.ApiDtos.MealDayTypeRequest;
import com.training.dto.ApiDtos.MealEntryBatchRequest;
import com.training.dto.ApiDtos.MealEntryRequest;
import com.training.dto.ApiDtos.MealEntryResponse;
import com.training.service.MealLogService;

import jakarta.validation.Valid;

/** 餐食记录接口。 */
@Validated
@RestController
@RequestMapping("/api/meals")
public class MealLogController {

    /** 餐食记录服务。 */
    private final MealLogService mealLogService;

    /** 创建餐食记录接口。 */
    public MealLogController(MealLogService mealLogService) {
        this.mealLogService = mealLogService;
    }

    /** 查询某天餐食。 */
    @GetMapping
    public MealDayResponse listByDate(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return mealLogService.listByDate(date == null ? LocalDate.now() : date);
    }

    /** 新增餐食明细。 */
    @PostMapping("/items")
    public MealEntryResponse addEntry(@Valid @RequestBody MealEntryRequest request) {
        return mealLogService.addEntry(request);
    }

    /** 批量新增餐食明细。 */
    @PostMapping("/items/batch")
    public List<MealEntryResponse> addEntries(@Valid @RequestBody MealEntryBatchRequest request) {
        return mealLogService.addEntries(request.items());
    }

    /** 更新某天绑定日型。 */
    @PutMapping("/day-type")
    public MealDayResponse updateDayType(@Valid @RequestBody MealDayTypeRequest request) {
        return mealLogService.updateDayType(request);
    }

    /** 修改餐食明细。 */
    @PutMapping("/items/{id}")
    public MealEntryResponse updateEntry(@PathVariable Long id, @Valid @RequestBody MealEntryRequest request) {
        return mealLogService.updateEntry(id, request);
    }

    /** 删除餐食明细。 */
    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        mealLogService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }

    /** 清空某天餐食。 */
    @DeleteMapping
    public ResponseEntity<Void> clearByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        mealLogService.clearByDate(date);
        return ResponseEntity.noContent().build();
    }
}
