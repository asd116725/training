package com.training.config;

import java.time.Duration;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.github.benmanes.caffeine.cache.Caffeine;

/** Caffeine 本地缓存配置。 */
@Configuration(proxyBeanMethods = false)
@EnableCaching
@Profile(CaffeineCacheConfig.DEMO_PROFILE)
public class CaffeineCacheConfig {

    /** 示例功能 Profile。 */
    public static final String DEMO_PROFILE = "caffeine-demo";

    /** 示例缓存管理器名称。 */
    public static final String DEMO_CACHE_MANAGER = "caffeineDemoCacheManager";

    /** 示例缓存名称。 */
    public static final String DEMO_CACHE_NAME = "caffeine-demo";

    /** 最大缓存条目数。 */
    private static final long MAXIMUM_SIZE = 100;

    /** 写入后的有效时间。 */
    private static final Duration EXPIRE_AFTER_WRITE = Duration.ofMinutes(10);

    /** 创建 Caffeine 缓存管理器。 */
    @Bean(DEMO_CACHE_MANAGER)
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(DEMO_CACHE_NAME);
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(MAXIMUM_SIZE)
                .expireAfterWrite(EXPIRE_AFTER_WRITE)
                .recordStats());
        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }
}
