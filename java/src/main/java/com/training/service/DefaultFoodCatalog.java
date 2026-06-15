package com.training.service;

import java.util.List;

/** 默认食材目录。 */
public final class DefaultFoodCatalog {

    /** 默认食材清单。 */
    private static final List<DefaultFood> FOODS = List.of(
            new DefaultFood("牛奶", 3.6, 5, 4, 70),
            new DefaultFood("虾", 20, 0, 0.5, 85),
            new DefaultFood("燕麦吐司", 8.7, 35.2, 5.5, 244),
            new DefaultFood("牛肉", 23, 0, 3, 120),
            new DefaultFood("蛋白粉", 73.1, 12.9, 3.5, 380),
            new DefaultFood("香蕉", 1.4, 22, 0.2, 93),
            new DefaultFood("蓝莓", 0.5, 14.5, 0.3, 57));

    /** 工具类构造函数。 */
    private DefaultFoodCatalog() {
    }

    /** 获取默认食材清单。 */
    public static List<DefaultFood> all() {
        return FOODS;
    }

    /** 默认食材快照。 */
    public record DefaultFood(String name, double protein, double carbs, double fat, double calories) {
    }
}
