package com.training.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** 餐次食材明细实体。 */
@Entity
@Table(name = "meal_log_items")
public class MealLogItem {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 所属餐次。 */
    @ManyToOne
    @JoinColumn(name = "meal_log_id")
    public MealLog mealLog;

    /** 食材。 */
    @ManyToOne
    @JoinColumn(name = "food_id")
    public Food food;

    /** 食用克数。 */
    public double grams;

    /** JPA 构造函数。 */
    protected MealLogItem() {
    }

    /** 创建餐次食材明细。 */
    public MealLogItem(MealLog mealLog, Food food, double grams) {
        this.mealLog = mealLog;
        this.food = food;
        this.grams = grams;
    }
}
