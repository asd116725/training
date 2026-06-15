package com.training.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.training.dto.ApiDtos.RecommendationRequest;
import com.training.dto.ApiDtos.RecommendationResponse;
import com.training.dto.ApiDtos.RecommendedItem;
import com.training.model.RecommendationRecord;
import com.training.repository.RecommendationRecordRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** 餐食推荐业务服务。 */
@Service
public class RecommendationService {

    /** 日志工具。 */
    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

    /** 营养计算服务。 */
    private final NutritionService nutritionService;

    /** 推荐记录仓库。 */
    private final RecommendationRecordRepository recommendationRecordRepository;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext;

    /** JSON 工具。 */
    private final ObjectMapper objectMapper;

    /** DeepSeek 密钥。 */
    private final String deepSeekApiKey;

    /** DeepSeek 地址。 */
    private final String deepSeekBaseUrl;

    /** DeepSeek 模型。 */
    private final String deepSeekModel;

    /** DeepSeek 连接超时毫秒数。 */
    private final int deepSeekConnectTimeoutMs;

    /** DeepSeek 读取超时毫秒数。 */
    private final int deepSeekReadTimeoutMs;

    /** 创建推荐服务。 */
    public RecommendationService(NutritionService nutritionService,
            RecommendationRecordRepository recommendationRecordRepository,
            CurrentUserContext currentUserContext,
            ObjectMapper objectMapper,
            @Value("${deepseek.api-key:}") String deepSeekApiKey,
            @Value("${deepseek.base-url:https://api.deepseek.com}") String deepSeekBaseUrl,
            @Value("${deepseek.model:deepseek-v4-pro}") String deepSeekModel,
            @Value("${deepseek.connect-timeout-ms:5000}") int deepSeekConnectTimeoutMs,
            @Value("${deepseek.read-timeout-ms:28000}") int deepSeekReadTimeoutMs) {
        this.nutritionService = nutritionService;
        this.recommendationRecordRepository = recommendationRecordRepository;
        this.currentUserContext = currentUserContext;
        this.objectMapper = objectMapper;
        this.deepSeekApiKey = deepSeekApiKey;
        this.deepSeekBaseUrl = deepSeekBaseUrl;
        this.deepSeekModel = deepSeekModel;
        this.deepSeekConnectTimeoutMs = deepSeekConnectTimeoutMs;
        this.deepSeekReadTimeoutMs = deepSeekReadTimeoutMs;
    }

    /** 生成推荐。 */
    public RecommendationResponse recommend(RecommendationRequest request) {
        RecommendationResponse response = deepSeekApiKey.isBlank() ? createMissingApiKeyResponse() : callDeepSeek(request);
        saveRecord(response);
        return response;
    }

    /** 生成缺少密钥响应。 */
    private RecommendationResponse createMissingApiKeyResponse() {
        return new RecommendationResponse("deepseek", "未配置 DeepSeek API Key，无法生成 AI 推荐。", List.of());
    }

    /** 调用 DeepSeek。 */
    private RecommendationResponse callDeepSeek(RecommendationRequest request) {
        try {
            RestClient client = createDeepSeekClient();
            log.info("DeepSeek 推荐开始：model={}, baseUrl={}, targetMeals={}, skippedMeals={}",
                    deepSeekModel, deepSeekBaseUrl, nutritionService.getTargetMeals(request), request.skippedMeals());

            RecommendationResponse response = sendDeepSeek(client, List.of(
                    Map.of("role", "system", "content", systemPrompt()),
                    Map.of("role", "user", "content", userPrompt(request))), 1);
            logValidationResult(request, response, 1);

            return coversTargetMeals(request, response) ? response : createInvalidAiResponse(request, response);
        } catch (Exception error) {
            if (error instanceof RestClientResponseException responseError) {
                log.error("DeepSeek HTTP 错误：status={}, body={}",
                        responseError.getStatusCode(), responseError.getResponseBodyAsString());
            }
            log.error("DeepSeek 推荐调用失败", error);
            return new RecommendationResponse("deepseek", "DeepSeek 未返回有效推荐：" + error.getMessage(), List.of());
        }
    }

    /** 创建带超时的 DeepSeek 客户端。 */
    private RestClient createDeepSeekClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(deepSeekConnectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(deepSeekReadTimeoutMs));
        return RestClient.builder().baseUrl(deepSeekBaseUrl).requestFactory(requestFactory).build();
    }

    /** 生成 AI 输出不合格响应。 */
    private RecommendationResponse createInvalidAiResponse(RecommendationRequest request, RecommendationResponse response) {
        return new RecommendationResponse("deepseek",
                "DeepSeek 未按 targetMeals 返回完整推荐，漏掉餐次：" + missingMeals(request, response)
                        + "，多余餐次：" + extraMeals(request, response),
                List.of());
    }

    /** 保存推荐记录。 */
    private void saveRecord(RecommendationResponse response) {
        try {
            recommendationRecordRepository.save(new RecommendationRecord(currentUserContext.get(), response.source(),
                    response.summary(), objectMapper.writeValueAsString(response.items())));
        } catch (Exception ignored) {
        }
    }

    /** DeepSeek 系统提示词。 */
    private String systemPrompt() {
        return """
                你是力量训练饮食助手。根据用户剩余热量、蛋白质、碳水、脂肪缺口和食材库，推荐未完成餐次的食材与克数。
                这是严格 JSON 生成任务，不是聊天任务。
                targetMeals 是本次必须补全的餐次清单，是最高优先级约束。
                items 必须覆盖 targetMeals 中的每一个餐次，每个餐次至少 1 条，建议每餐 1-4 条。
                items 中的 meal 必须且只能来自 targetMeals，不要给 targetMeals 之外的餐次推荐，也不要给 skippedMeals 中值为 true 的餐次推荐。
                如果 customRequirement 不为空，优先满足用户本次自由输入的推荐要求。
                foodName 必须使用 foods 中已有的食材名称，避免推荐无法导入食材库的食物。
                每条 calories、protein、carbs、fat 必须按 food 每 100g 营养和 grams 换算。
                只返回 JSON 对象，不要 Markdown，不要解释。格式为：
                {"source":"deepseek","summary":"一句中文摘要","items":[{"meal":"preWorkout","foodName":"米饭","grams":120,"calories":139,"protein":3.1,"carbs":31.1,"fat":0.4}]}
                meal 只能使用 breakfast、lunch、preWorkout、postWorkout、dinner。
                """;
    }

    /** 组装用户提示词。 */
    private String userPrompt(RecommendationRequest request) throws Exception {
        return """
                请严格根据下面 JSON 生成推荐：
                %s

                本次必须生成的餐次 targetMeals：
                %s

                强制要求：
                1. targetMeals 中每一个餐次都必须在 items 里出现，不能遗漏。尤其是 postWorkout 表示练后餐。
                2. items 里不能出现 targetMeals 之外的餐次。
                3. 如果 customRequirement 写了“晚餐不吃蛋白粉”，只表示 dinner 不使用蛋白粉；其他餐次除非明确禁止，否则可以根据营养缺口判断。
                4. foodName 只能从 foods[].name 中选择。
                5. 返回 JSON 对象，source 固定为 "deepseek"。
                6. 请先为 targetMeals 的每个餐次分别规划，再合并到 items 数组中。
                """.formatted(objectMapper.writeValueAsString(request), nutritionService.getTargetMeals(request));
    }

    /** 发起 DeepSeek 请求并解析响应。 */
    private RecommendationResponse sendDeepSeek(RestClient client, List<Map<String, String>> messages, int attempt) throws Exception {
        long startedAt = System.nanoTime();
        JsonNode response = client.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + deepSeekApiKey)
                .body(Map.of(
                        "model", deepSeekModel,
                        "temperature", 0.1,
                        "max_tokens", 2048,
                        "thinking", Map.of("type", "disabled"),
                        "response_format", Map.of("type", "json_object"),
                        "messages", messages))
                .retrieve()
                .body(JsonNode.class);
        String content = response.path("choices").path(0).path("message").path("content").asText();
        String finishReason = response.path("choices").path(0).path("finish_reason").asText();
        long costMs = (System.nanoTime() - startedAt) / 1_000_000;
        log.info("DeepSeek 第 {} 次原始响应：costMs={}, finishReason={}, content={}",
                attempt, costMs, finishReason, content);

        RecommendationResponse parsedResponse = objectMapper.readValue(extractJson(content), RecommendationResponse.class);
        log.info("DeepSeek 第 {} 次解析响应：source={}, summary={}, items={}",
                attempt, parsedResponse.source(), parsedResponse.summary(),
                objectMapper.writeValueAsString(parsedResponse.items()));
        return parsedResponse;
    }

    /** 判断 AI 响应是否覆盖目标餐次。 */
    private boolean coversTargetMeals(RecommendationRequest request, RecommendationResponse response) {
        return missingMeals(request, response).isEmpty() && extraMeals(request, response).isEmpty();
    }

    /** 获取 AI 漏掉的餐次。 */
    private List<String> missingMeals(RecommendationRequest request, RecommendationResponse response) {
        Set<String> coveredMeals = mealSet(response);
        return nutritionService.getTargetMeals(request).stream().filter(meal -> !coveredMeals.contains(meal)).toList();
    }

    /** 获取 AI 多生成的餐次。 */
    private List<String> extraMeals(RecommendationRequest request, RecommendationResponse response) {
        Set<String> targetMeals = Set.copyOf(nutritionService.getTargetMeals(request));
        return mealSet(response).stream().filter(meal -> !targetMeals.contains(meal)).toList();
    }

    /** 提取响应中的餐次集合。 */
    private Set<String> mealSet(RecommendationResponse response) {
        List<RecommendedItem> items = response.items() == null ? List.of() : response.items();
        return items.stream().map(RecommendedItem::meal).collect(Collectors.toSet());
    }

    /** 记录 DeepSeek 响应校验结果。 */
    private void logValidationResult(RecommendationRequest request, RecommendationResponse response, int attempt) {
        log.info("DeepSeek 第 {} 次校验：targetMeals={}, responseMeals={}, missingMeals={}, extraMeals={}",
                attempt, nutritionService.getTargetMeals(request), mealSet(response), missingMeals(request, response),
                extraMeals(request, response));
    }

    /** 提取 JSON 内容。 */
    private String extractJson(String content) {
        int start = content.indexOf('{');
        int end = content.lastIndexOf('}');
        return start >= 0 && end > start ? content.substring(start, end + 1) : content;
    }
}
