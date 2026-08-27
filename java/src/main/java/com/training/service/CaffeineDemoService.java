package com.training.service;

import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.stats.CacheStats;
import com.training.config.CaffeineCacheConfig;
import com.training.dto.CaffeineDemoDtos.CacheStatistics;
import com.training.dto.CaffeineDemoDtos.CacheValue;

/** Caffeine 注解用法示例服务。 */
@Service
@Profile(CaffeineCacheConfig.DEMO_PROFILE)
@CacheConfig(cacheManager = CaffeineCacheConfig.DEMO_CACHE_MANAGER,
        cacheNames = CaffeineCacheConfig.DEMO_CACHE_NAME)
public class CaffeineDemoService {

    /** 模拟数据源最大条目数。 */
    private static final long SOURCE_MAXIMUM_SIZE = 100;

    /** 模拟真实数据源。 */
    private final Cache<String, String> source = Caffeine.newBuilder()
            .maximumSize(SOURCE_MAXIMUM_SIZE)
            .build();

    /** 数据源操作序号。 */
    private final AtomicLong sourceSequence = new AtomicLong();

    /** Spring 缓存管理器。 */
    private final CacheManager cacheManager;

    /** 创建 Caffeine 示例服务。 */
    public CaffeineDemoService(
            @Qualifier(CaffeineCacheConfig.DEMO_CACHE_MANAGER) CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /** 查询数据，未命中时只允许一个线程加载同一缓存键。 */
    @Cacheable(key = "#key", sync = true)
    public CacheValue find(String key) {
        long sequence = sourceSequence.incrementAndGet();
        String value = source.getIfPresent(key);
        value = value == null ? "数据源自动生成：" + key : value;
        return new CacheValue(key, value, sequence, Instant.now());
    }

    /** 更新模拟数据源，并用返回值覆盖缓存。 */
    @CachePut(key = "#key")
    public CacheValue update(String key, String value) {
        source.put(key, value);
        return new CacheValue(key, value, sourceSequence.incrementAndGet(), Instant.now());
    }

    /** 使指定缓存键失效。 */
    @CacheEvict(key = "#key")
    public void evict(String key) {
    }

    /** 清空示例缓存。 */
    @CacheEvict(allEntries = true)
    public void clear() {
    }

    /** 查询 Caffeine 原生统计信息。 */
    public CacheStatistics statistics() {
        CaffeineCache cache = (CaffeineCache) Objects.requireNonNull(
                cacheManager.getCache(CaffeineCacheConfig.DEMO_CACHE_NAME));
        Cache<Object, Object> nativeCache = cache.getNativeCache();
        CacheStats stats = nativeCache.stats();
        return new CacheStatistics(nativeCache.estimatedSize(), stats.requestCount(), stats.hitCount(),
                stats.missCount(), stats.loadSuccessCount(), stats.evictionCount(), stats.hitRate());
    }
}
