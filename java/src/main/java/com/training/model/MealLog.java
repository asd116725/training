package com.training.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** 每日餐次记录实体。 */
@Entity
@Table(name = "meal_logs")
public class MealLog {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 所属用户。 */
    @ManyToOne
    @JoinColumn(name = "user_id")
    public AppUser user;

    /** 记录日期。 */
    public LocalDate logDate;

    /** 餐次。 */
    @Enumerated(EnumType.STRING)
    public MealType mealType;

    /** 减脂计划日型。 */
    @Column(name = "cutting_cycle_type", nullable = false)
    @Enumerated(EnumType.STRING)
    public CycleType cuttingCycleType = CycleType.MEDIUM;

    /** 增肌计划日型。 */
    @Column(name = "bulking_day_type", nullable = false)
    @Enumerated(EnumType.STRING)
    public CycleType bulkingDayType = CycleType.TRAINING;

    /** JPA 构造函数。 */
    protected MealLog() {
    }

    /** 创建餐次记录。 */
    public MealLog(LocalDate logDate, MealType mealType) {
        this(null, logDate, mealType);
    }

    /** 创建当前用户餐次记录。 */
    public MealLog(AppUser user, LocalDate logDate, MealType mealType) {
        this.user = user;
        this.logDate = logDate;
        this.mealType = mealType;
    }
}
