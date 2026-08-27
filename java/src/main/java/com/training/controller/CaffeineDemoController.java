package com.training.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.training.config.CaffeineCacheConfig;
import com.training.dto.CaffeineDemoDtos.CacheStatistics;
import com.training.dto.CaffeineDemoDtos.CacheValue;
import com.training.service.CaffeineDemoService;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Caffeine 示例接口。 */
@RestController
@RequestMapping("/api/demo/caffeine")
@Profile(CaffeineCacheConfig.DEMO_PROFILE)
public class CaffeineDemoController {

    /** 缓存键最大长度。 */
    private static final int MAX_KEY_LENGTH = 64;

    /** 缓存值最大长度。 */
    private static final int MAX_VALUE_LENGTH = 200;

    /** Caffeine 示例服务。 */
    private final CaffeineDemoService caffeineDemoService;

    /** 创建 Caffeine 示例接口。 */
    public CaffeineDemoController(CaffeineDemoService caffeineDemoService) {
        this.caffeineDemoService = caffeineDemoService;
    }

    /** 查询缓存值。 */
    @GetMapping("/entries/{key}")
    public CacheValue find(@PathVariable @NotBlank @Size(max = MAX_KEY_LENGTH) String key) {
        return caffeineDemoService.find(key);
    }

    /** 更新数据源与缓存值。 */
    @PutMapping("/entries/{key}")
    public CacheValue update(@PathVariable @NotBlank @Size(max = MAX_KEY_LENGTH) String key,
            @RequestParam @NotBlank @Size(max = MAX_VALUE_LENGTH) String value) {
        return caffeineDemoService.update(key, value);
    }

    /** 使指定缓存键失效。 */
    @DeleteMapping("/entries/{key}")
    public ResponseEntity<Void> evict(@PathVariable @NotBlank @Size(max = MAX_KEY_LENGTH) String key) {
        caffeineDemoService.evict(key);
        return ResponseEntity.noContent().build();
    }

    /** 清空示例缓存。 */
    @DeleteMapping("/entries")
    public ResponseEntity<Void> clear() {
        caffeineDemoService.clear();
        return ResponseEntity.noContent().build();
    }

    /** 查询缓存统计。 */
    @GetMapping("/stats")
    public CacheStatistics statistics() {
        return caffeineDemoService.statistics();
    }
}
