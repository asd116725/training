package com.training.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.training.dto.ApiDtos.RecommendationRequest;
import com.training.dto.ApiDtos.RecommendationResponse;
import com.training.service.RecommendationService;

/** 推荐接口。 */
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    /** 推荐服务。 */
    private final RecommendationService recommendationService;

    /** 创建推荐接口。 */
    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    /** 预览补餐推荐。 */
    @PostMapping("/preview")
    public RecommendationResponse preview(@RequestBody RecommendationRequest request) {
        return recommendationService.recommend(request);
    }
}
