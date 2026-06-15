package com.training.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

/** 食材实体。 */
@Entity
@Table(name = "foods")
public class Food {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 所属用户，空表示旧版公共食材。 */
    @ManyToOne
    @JoinColumn(name = "user_id")
    public AppUser user;

    /** 食材名称。 */
    public String name;

    /** 每百克蛋白质。 */
    public double protein;

    /** 每百克碳水。 */
    public double carbs;

    /** 每百克脂肪。 */
    public double fat;

    /** 每百克热量。 */
    public double calories;

    /** 食材备注。 */
    @Column(length = 255, nullable = false)
    public String remark = "";

    /** 是否为系统默认补种食材。 */
    @Column(name = "default_seed", nullable = false)
    public boolean defaultSeed;

    /** JPA 构造函数。 */
    protected Food() {
    }

    /** 创建食材。 */
    public Food(String name, double protein, double carbs, double fat, double calories) {
        this(null, name, protein, carbs, fat, calories);
    }

    /** 创建带备注的食材。 */
    public Food(String name, double protein, double carbs, double fat, double calories, String remark) {
        this(null, name, protein, carbs, fat, calories, remark);
    }

    /** 创建用户食材。 */
    public Food(AppUser user, String name, double protein, double carbs, double fat, double calories) {
        this(user, name, protein, carbs, fat, calories, false);
    }

    /** 创建带备注的用户食材。 */
    public Food(AppUser user, String name, double protein, double carbs, double fat, double calories, String remark) {
        this(user, name, protein, carbs, fat, calories, remark, false);
    }

    /** 创建用户食材。 */
    public Food(AppUser user, String name, double protein, double carbs, double fat, double calories,
            boolean defaultSeed) {
        this(user, name, protein, carbs, fat, calories, "", defaultSeed);
    }

    /** 创建完整用户食材。 */
    public Food(AppUser user, String name, double protein, double carbs, double fat, double calories,
            String remark, boolean defaultSeed) {
        this.user = user;
        this.name = name;
        this.protein = protein;
        this.carbs = carbs;
        this.fat = fat;
        this.calories = calories;
        this.remark = remark == null ? "" : remark;
        this.defaultSeed = defaultSeed;
    }
}
