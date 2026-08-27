package com.training.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import com.training.controller.CaffeineDemoController;
import com.training.service.CaffeineDemoService;

/** Caffeine 示例 Profile 测试。 */
class CaffeineDemoProfileTest {

    /** 验证默认环境不会注册教学接口。 */
    @Test
    void shouldKeepDemoDisabledByDefault() {
        try (AnnotationConfigApplicationContext context = createContext()) {
            assertFalse(context.containsBean("caffeineDemoController"));
        }
    }

    /** 验证显式启用 Profile 后注册教学接口。 */
    @Test
    void shouldEnableDemoWithCaffeineDemoProfile() {
        try (AnnotationConfigApplicationContext context = createContext("caffeine-demo")) {
            assertTrue(context.containsBean("caffeineDemoController"));
        }
    }

    /** 按指定 Profile 创建最小应用上下文。 */
    private AnnotationConfigApplicationContext createContext(String... profiles) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.getEnvironment().setActiveProfiles(profiles);
        context.register(CaffeineCacheConfig.class, CaffeineDemoService.class, CaffeineDemoController.class);
        context.refresh();
        return context;
    }
}
