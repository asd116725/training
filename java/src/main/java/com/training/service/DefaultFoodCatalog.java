package com.training.service;

import java.util.List;

/** 默认食材目录。 */
public final class DefaultFoodCatalog {

    /** 默认食材清单。 */
    private static final List<DefaultFood> FOODS = List.of(
            new DefaultFood("牛奶", "克", 1, 0.036, 0.05, 0.04, 0.7),
            new DefaultFood("虾", "克", 1, 0.2, 0, 0.005, 0.85),
            new DefaultFood("燕麦吐司", "克", 1, 0.087, 0.352, 0.055, 2.44),
            new DefaultFood("牛肉", "克", 1, 0.23, 0, 0.03, 1.2),
            new DefaultFood("蛋白粉", "克", 1, 0.731, 0.129, 0.035, 3.8),
            new DefaultFood("香蕉", "克", 1, 0.014, 0.22, 0.002, 0.93),
            new DefaultFood("蓝莓", "克", 1, 0.005, 0.145, 0.003, 0.57));

    /** 工具类构造函数。 */
    private DefaultFoodCatalog() {
    }

    /** 获取默认食材清单。 */
    public static List<DefaultFood> all() {
        return FOODS;
    }

    /** 默认食材快照。 */
    public record DefaultFood(String name, String unitName, double unitWeight, double protein, double carbs, double fat,
            double calories) {
    }
}
