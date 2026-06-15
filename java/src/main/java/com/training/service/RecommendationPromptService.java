package com.training.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.training.dto.ApiDtos.RecommendationPromptOrderRequest;
import com.training.dto.ApiDtos.RecommendationPromptRequest;
import com.training.dto.ApiDtos.RecommendationPromptResponse;
import com.training.model.AppUser;
import com.training.model.RecommendationPrompt;
import com.training.repository.RecommendationPromptRepository;

/** 推荐提示词业务服务。 */
@Service
public class RecommendationPromptService {

    /** 推荐提示词仓库。 */
    private final RecommendationPromptRepository recommendationPromptRepository;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext;

    /** 创建推荐提示词服务。 */
    public RecommendationPromptService(RecommendationPromptRepository recommendationPromptRepository,
            CurrentUserContext currentUserContext) {
        this.recommendationPromptRepository = recommendationPromptRepository;
        this.currentUserContext = currentUserContext;
    }

    /** 查询全部推荐提示词。 */
    public List<RecommendationPromptResponse> listPrompts() {
        List<RecommendationPrompt> prompts = recommendationPromptRepository
                .findAllByUserOrderBySortOrderAscIdAsc(currentUserContext.get());
        normalizeSortOrders(prompts);
        return prompts.stream().map(this::toResponse).toList();
    }

    /** 新增推荐提示词。 */
    public RecommendationPromptResponse createPrompt(RecommendationPromptRequest request) {
        AppUser user = currentUserContext.get();
        RecommendationPrompt prompt = recommendationPromptRepository.save(new RecommendationPrompt(user,
                request.title(), request.content(), nextSortOrder(user)));
        return toResponse(prompt);
    }

    /** 修改推荐提示词。 */
    public RecommendationPromptResponse updatePrompt(Long id, RecommendationPromptRequest request) {
        RecommendationPrompt prompt = getPrompt(id);
        prompt.title = request.title();
        prompt.content = request.content();
        return toResponse(recommendationPromptRepository.save(prompt));
    }

    /** 删除推荐提示词。 */
    public void deletePrompt(Long id) {
        recommendationPromptRepository.delete(getPrompt(id));
    }

    /** 保存推荐提示词顺序。 */
    @Transactional
    public List<RecommendationPromptResponse> reorderPrompts(RecommendationPromptOrderRequest request) {
        List<RecommendationPrompt> prompts = recommendationPromptRepository
                .findAllByUserOrderBySortOrderAscIdAsc(currentUserContext.get());
        Map<Long, RecommendationPrompt> promptMap = prompts.stream()
                .collect(Collectors.toMap(prompt -> prompt.id, Function.identity()));
        int sortOrder = 1;

        for (Long id : request.ids()) {
            RecommendationPrompt prompt = promptMap.remove(id);

            if (prompt != null) {
                prompt.sortOrder = sortOrder;
                sortOrder += 1;
            }
        }

        for (RecommendationPrompt prompt : prompts) {
            if (promptMap.containsKey(prompt.id)) {
                prompt.sortOrder = sortOrder;
                sortOrder += 1;
            }
        }

        recommendationPromptRepository.saveAll(prompts);
        return listPrompts();
    }

    /** 按主键查询推荐提示词。 */
    private RecommendationPrompt getPrompt(Long id) {
        AppUser user = currentUserContext.get();
        RecommendationPrompt prompt = recommendationPromptRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "推荐提示词不存在"));

        if (prompt.user == null || !prompt.user.id.equals(user.id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "推荐提示词不存在");
        }

        return prompt;
    }

    /** 获取下一位排序值。 */
    private int nextSortOrder(AppUser user) {
        return recommendationPromptRepository.findMaxSortOrderByUser(user) + 1;
    }

    /** 修复旧数据缺失的排序值。 */
    private void normalizeSortOrders(List<RecommendationPrompt> prompts) {
        int nextSortOrder = nextSortOrder(currentUserContext.get());
        boolean hasChanged = false;

        for (RecommendationPrompt prompt : prompts) {
            if (prompt.sortOrder == null || prompt.sortOrder <= 0) {
                prompt.sortOrder = nextSortOrder;
                nextSortOrder += 1;
                hasChanged = true;
            }
        }

        if (hasChanged) {
            recommendationPromptRepository.saveAll(prompts);
        }
    }

    /** 转换推荐提示词响应。 */
    private RecommendationPromptResponse toResponse(RecommendationPrompt prompt) {
        return new RecommendationPromptResponse(prompt.id, prompt.title, prompt.content, prompt.sortOrder == null ? 0 : prompt.sortOrder);
    }
}
