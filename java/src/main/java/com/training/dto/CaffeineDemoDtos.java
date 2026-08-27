package com.training.dto;

import java.time.Instant;

/** Caffeine 示例 DTO 集合。 */
public final class CaffeineDemoDtos {

    /** 工具类构造函数。 */
    private CaffeineDemoDtos() {
    }

    /** 缓存值。 */
    public record CacheValue(String key, String value, long sourceSequence, Instant cachedAt) {
    }

    /** 缓存统计。 */
    public record CacheStatistics(long estimatedSize, long requestCount, long hitCount, long missCount,
            long loadSuccessCount, long evictionCount, double hitRate) {
    }
}
