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

import com.training.dto.ApiDtos.RecommendationPromptOrderRequest;
import com.training.dto.ApiDtos.RecommendationPromptRequest;
import com.training.dto.ApiDtos.RecommendationPromptResponse;
import com.training.service.RecommendationPromptService;

import jakarta.validation.Valid;

/** 推荐提示词接口。 */
@Validated
@RestController
@RequestMapping("/api/recommendation-prompts")
public class RecommendationPromptController {

    /** 推荐提示词服务。 */
    private final RecommendationPromptService recommendationPromptService;

    /** 创建推荐提示词接口。 */
    public RecommendationPromptController(RecommendationPromptService recommendationPromptService) {
        this.recommendationPromptService = recommendationPromptService;
    }

    /** 查询推荐提示词列表。 */
    @GetMapping
    public List<RecommendationPromptResponse> listPrompts() {
        return recommendationPromptService.listPrompts();
    }

    /** 新增推荐提示词。 */
    @PostMapping
    public RecommendationPromptResponse createPrompt(@Valid @RequestBody RecommendationPromptRequest request) {
        return recommendationPromptService.createPrompt(request);
    }

    /** 保存推荐提示词顺序。 */
    @PutMapping("/order")
    public List<RecommendationPromptResponse> reorderPrompts(@Valid @RequestBody RecommendationPromptOrderRequest request) {
        return recommendationPromptService.reorderPrompts(request);
    }

    /** 修改推荐提示词。 */
    @PutMapping("/{id}")
    public RecommendationPromptResponse updatePrompt(@PathVariable Long id,
            @Valid @RequestBody RecommendationPromptRequest request) {
        return recommendationPromptService.updatePrompt(id, request);
    }

    /** 删除推荐提示词。 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrompt(@PathVariable Long id) {
        recommendationPromptService.deletePrompt(id);
        return ResponseEntity.noContent().build();
    }
}
