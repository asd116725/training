package com.training.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** 用户个人档案实体。 */
@Entity
@Table(name = "user_profiles")
public class UserProfile {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 所属用户。 */
    @ManyToOne
    @JoinColumn(name = "user_id")
    public AppUser user;

    /** 性别。 */
    @Enumerated(EnumType.STRING)
    public Gender gender;

    /** 身高，单位厘米。 */
    public double height;

    /** 体重，单位千克。 */
    public double weight;

    /** 年龄。 */
    public int age;

    /** 当前体脂率。 */
    public double bodyFat;

    /** 目标体脂率。 */
    public double targetBodyFat;

    /** 活动系数。 */
    public double activityLevel;

    /** JPA 构造函数。 */
    protected UserProfile() {
    }

    /** 创建用户个人档案。 */
    public UserProfile(Gender gender, double height, double weight, int age, double bodyFat, double targetBodyFat,
            double activityLevel) {
        this(null, gender, height, weight, age, bodyFat, targetBodyFat, activityLevel);
    }

    /** 创建当前用户个人档案。 */
    public UserProfile(AppUser user, Gender gender, double height, double weight, int age, double bodyFat,
            double targetBodyFat, double activityLevel) {
        this.user = user;
        this.gender = gender;
        this.height = height;
        this.weight = weight;
        this.age = age;
        this.bodyFat = bodyFat;
        this.targetBodyFat = targetBodyFat;
        this.activityLevel = activityLevel;
    }
}
