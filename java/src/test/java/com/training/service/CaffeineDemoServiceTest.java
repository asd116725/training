package com.training.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import com.training.config.CaffeineCacheConfig;
import com.training.dto.CaffeineDemoDtos.CacheStatistics;
import com.training.dto.CaffeineDemoDtos.CacheValue;

/** Caffeine 示例服务测试。 */
@SpringJUnitConfig(classes = { CaffeineCacheConfig.class, CaffeineDemoService.class })
@ActiveProfiles("caffeine-demo")
class CaffeineDemoServiceTest {

    /** Caffeine 示例服务代理。 */
    @Autowired
    private CaffeineDemoService caffeineDemoService;

    /** Spring 缓存管理器。 */
    @Autowired
    @Qualifier(CaffeineCacheConfig.DEMO_CACHE_MANAGER)
    private CacheManager cacheManager;

    /** 清空测试缓存。 */
    @BeforeEach
    void clearCache() {
        cacheManager.getCache(CaffeineCacheConfig.DEMO_CACHE_NAME).clear();
    }

    /** 验证相同键的重复查询复用缓存值。 */
    @Test
    void shouldReuseCachedValueForSameKey() {
        CacheValue first = caffeineDemoService.find("protein-reuse");
        CacheValue second = caffeineDemoService.find("protein-reuse");

        assertSame(first, second);
        assertEquals(first.sourceSequence(), second.sourceSequence());
    }

    /** 验证主动更新会同时覆盖缓存。 */
    @Test
    void shouldReplaceCachedValueWhenUpdating() {
        CacheValue initial = caffeineDemoService.find("protein-update");

        CacheValue updated = caffeineDemoService.update("protein-update", "手动写入的高蛋白建议");
        CacheValue cached = caffeineDemoService.find("protein-update");

        assertSame(updated, cached);
        assertEquals("手动写入的高蛋白建议", cached.value());
        assertTrue(cached.sourceSequence() > initial.sourceSequence());
    }

    /** 验证单条失效后会重新加载。 */
    @Test
    void shouldReloadValueAfterEvictingKey() {
        CacheValue first = caffeineDemoService.find("carbs-evict");

        caffeineDemoService.evict("carbs-evict");
        CacheValue reloaded = caffeineDemoService.find("carbs-evict");

        assertNotSame(first, reloaded);
        assertTrue(reloaded.sourceSequence() > first.sourceSequence());
    }

    /** 验证全量清空后所有键都会重新加载。 */
    @Test
    void shouldReloadAllValuesAfterClearingCache() {
        CacheValue firstProtein = caffeineDemoService.find("protein-clear");
        CacheValue firstCarbs = caffeineDemoService.find("carbs-clear");

        caffeineDemoService.clear();

        assertTrue(caffeineDemoService.find("protein-clear").sourceSequence() > firstProtein.sourceSequence());
        assertTrue(caffeineDemoService.find("carbs-clear").sourceSequence() > firstCarbs.sourceSequence());
    }

    /** 验证可以观察缓存命中与未命中统计。 */
    @Test
    void shouldExposeCacheStatistics() {
        CacheStatistics before = caffeineDemoService.statistics();

        caffeineDemoService.find("fat-stats");
        caffeineDemoService.find("fat-stats");
        CacheStatistics after = caffeineDemoService.statistics();

        assertEquals(1, after.estimatedSize());
        assertEquals(before.requestCount() + 2, after.requestCount());
        assertEquals(before.hitCount() + 1, after.hitCount());
        assertEquals(before.missCount() + 1, after.missCount());
        assertEquals(before.loadSuccessCount() + 1, after.loadSuccessCount());
    }
}
