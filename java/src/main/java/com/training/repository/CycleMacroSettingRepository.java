package com.training.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.training.model.AppUser;
import com.training.model.CycleMacroSetting;
import com.training.model.CycleType;

/** 碳循环宏量配置仓库。 */
public interface CycleMacroSettingRepository extends JpaRepository<CycleMacroSetting, Long> {

    /** 按用户和碳循环日类型查询配置。 */
    Optional<CycleMacroSetting> findByUserAndCycleType(AppUser user, CycleType cycleType);
}
