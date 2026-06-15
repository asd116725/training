package com.training.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.training.dto.ApiDtos.DailyPlan;
import com.training.dto.ApiDtos.ProfileRequest;
import com.training.dto.ApiDtos.ProfileResponse;
import com.training.dto.ApiDtos.ProfileStatusResponse;
import com.training.service.NutritionService;
import com.training.service.ProfileService;

import jakarta.validation.Valid;

/** 个人档案接口。 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    /** 用户档案服务。 */
    private final ProfileService profileService;

    /** 营养计算服务。 */
    private final NutritionService nutritionService;

    /** 创建个人档案接口。 */
    public ProfileController(ProfileService profileService, NutritionService nutritionService) {
        this.profileService = profileService;
        this.nutritionService = nutritionService;
    }

    /** 查询个人档案。 */
    @GetMapping
    public ProfileStatusResponse getProfile() {
        return profileService.getProfile();
    }

    /** 保存个人档案。 */
    @PostMapping
    public ProfileResponse saveProfile(@Valid @RequestBody ProfileRequest request) {
        return profileService.saveProfile(request);
    }

    /** 计算每日饮食目标。 */
    @PostMapping("/daily-plan")
    public DailyPlan calculateDailyPlan(@Valid @RequestBody ProfileRequest request,
            @RequestParam(defaultValue = "medium") String cycleType) {
        return nutritionService.calculateDailyPlan(request, cycleType);
    }
}
