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

/** 碳循环宏量配置实体。 */
@Entity
@Table(name = "cycle_macro_settings")
public class CycleMacroSetting {

    /** 主键。 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** 所属用户。 */
    @ManyToOne
    @JoinColumn(name = "user_id")
    public AppUser user;

    /** 碳循环日类型。 */
    @Enumerated(EnumType.STRING)
    public CycleType cycleType;

    /** 每公斤体重碳水。 */
    public double carbsPerKg;

    /** 每公斤体重蛋白。 */
    public double proteinPerKg;

    /** 每公斤体重脂肪。 */
    public double fatPerKg;

    /** JPA 构造函数。 */
    protected CycleMacroSetting() {
    }

    /** 创建碳循环宏量配置。 */
    public CycleMacroSetting(CycleType cycleType, double carbsPerKg, double proteinPerKg, double fatPerKg) {
        this(null, cycleType, carbsPerKg, proteinPerKg, fatPerKg);
    }

    /** 创建当前用户碳循环宏量配置。 */
    public CycleMacroSetting(AppUser user, CycleType cycleType, double carbsPerKg, double proteinPerKg,
            double fatPerKg) {
        this.user = user;
        this.cycleType = cycleType;
        this.carbsPerKg = carbsPerKg;
        this.proteinPerKg = proteinPerKg;
        this.fatPerKg = fatPerKg;
    }
}
