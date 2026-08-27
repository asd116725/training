package com.training.controller;

import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import com.training.config.AuthInterceptor;
import com.training.config.CaffeineCacheConfig;
import com.training.config.WebConfig;
import com.training.dto.CaffeineDemoDtos.CacheValue;
import com.training.model.AppUser;
import com.training.service.AuthService;
import com.training.service.CaffeineDemoService;
import com.training.service.CurrentUserContext;

/** Caffeine 示例接口测试。 */
@SpringJUnitWebConfig(CaffeineDemoControllerTest.TestConfig.class)
@ActiveProfiles("caffeine-demo")
class CaffeineDemoControllerTest {

    /** 测试登录 Token。 */
    private static final String DEMO_TOKEN = "demo-token";

    /** Web 应用上下文。 */
    @Autowired
    private WebApplicationContext applicationContext;

    /** Caffeine 示例服务代理。 */
    @Autowired
    private CaffeineDemoService caffeineDemoService;

    /** 登录服务测试替身。 */
    @Autowired
    private AuthService authService;

    /** MVC 测试客户端。 */
    private MockMvc mockMvc;

    /** 初始化 MVC 测试客户端和缓存。 */
    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext).build();
        caffeineDemoService.clear();
        AppUser user = new AppUser("13800000000", "hash");
        user.id = 1L;
        when(authService.authenticate(DEMO_TOKEN)).thenReturn(user);
    }

    /** 验证查询接口返回缓存值。 */
    @Test
    void shouldExposeCachedValueEndpoint() throws Exception {
        mockMvc.perform(authorized(get("/api/demo/caffeine/entries/protein-query")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("protein-query"))
                .andExpect(jsonPath("$.value").value("数据源自动生成：protein-query"));
    }

    /** 验证示例接口沿用项目登录校验。 */
    @Test
    void shouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/demo/caffeine/entries/protein-auth"))
                .andExpect(status().isUnauthorized());
    }

    /** 验证更新接口覆盖缓存值。 */
    @Test
    void shouldExposeCacheUpdateEndpoint() throws Exception {
        mockMvc.perform(authorized(put("/api/demo/caffeine/entries/protein-update")
                .queryParam("value", "手动更新值")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("手动更新值"));

        mockMvc.perform(authorized(get("/api/demo/caffeine/entries/protein-update")))
                .andExpect(jsonPath("$.value").value("手动更新值"));
    }

    /** 验证过长缓存键会被拒绝。 */
    @Test
    void shouldRejectOversizedCacheKey() throws Exception {
        mockMvc.perform(authorized(get("/api/demo/caffeine/entries/{key}", "a".repeat(65))))
                .andExpect(status().isBadRequest());
    }

    /** 验证空白更新值会被拒绝。 */
    @Test
    void shouldRejectBlankCacheValue() throws Exception {
        mockMvc.perform(authorized(put("/api/demo/caffeine/entries/protein-invalid")
                .queryParam("value", " ")))
                .andExpect(status().isBadRequest());
    }

    /** 验证单条失效接口会删除目标缓存。 */
    @Test
    void shouldExposeCacheEvictionEndpoint() throws Exception {
        CacheValue first = caffeineDemoService.find("carbs-evict");

        mockMvc.perform(authorized(delete("/api/demo/caffeine/entries/carbs-evict")))
                .andExpect(status().isNoContent());

        assertNotSame(first, caffeineDemoService.find("carbs-evict"));
    }

    /** 验证全量清空接口会删除所有缓存。 */
    @Test
    void shouldExposeCacheClearEndpoint() throws Exception {
        CacheValue first = caffeineDemoService.find("protein-clear");

        mockMvc.perform(authorized(delete("/api/demo/caffeine/entries")))
                .andExpect(status().isNoContent());

        assertNotSame(first, caffeineDemoService.find("protein-clear"));
    }

    /** 验证统计接口返回命中数据。 */
    @Test
    void shouldExposeCacheStatisticsEndpoint() throws Exception {
        caffeineDemoService.find("fat-stats");
        caffeineDemoService.find("fat-stats");

        mockMvc.perform(authorized(get("/api/demo/caffeine/stats")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estimatedSize").value(1))
                .andExpect(jsonPath("$.requestCount").isNumber())
                .andExpect(jsonPath("$.hitCount").isNumber())
                .andExpect(jsonPath("$.missCount").isNumber());
    }

    /** 为请求添加有效登录 Token。 */
    private MockHttpServletRequestBuilder authorized(MockHttpServletRequestBuilder request) {
        return request.header(HttpHeaders.AUTHORIZATION, "Bearer " + DEMO_TOKEN);
    }

    /** 最小 Web 测试配置。 */
    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    @Import({ CaffeineCacheConfig.class, CaffeineDemoService.class, CaffeineDemoController.class,
            CurrentUserContext.class, AuthInterceptor.class, WebConfig.class })
    static class TestConfig {

        /** 创建登录服务测试替身。 */
        @Bean
        AuthService authService() {
            return mock(AuthService.class);
        }
    }
}
