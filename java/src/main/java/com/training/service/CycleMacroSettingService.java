package com.training.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.training.dto.ApiDtos.CycleMacroSettingRequest;
import com.training.dto.ApiDtos.CycleMacroSettingResponse;
import com.training.dto.ApiDtos.CycleMacroSettingsRequest;
import com.training.dto.ApiDtos.CycleMacroSettingsResponse;
import com.training.model.AppUser;
import com.training.model.CycleMacroSetting;
import com.training.model.CycleType;
import com.training.repository.CycleMacroSettingRepository;

/** 碳循环宏量配置服务。 */
@Service
public class CycleMacroSettingService {

    /** 碳循环宏量配置仓库。 */
    private final CycleMacroSettingRepository cycleMacroSettingRepository;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext;

    /** 创建碳循环宏量配置服务。 */
    public CycleMacroSettingService(CycleMacroSettingRepository cycleMacroSettingRepository,
            CurrentUserContext currentUserContext) {
        this.cycleMacroSettingRepository = cycleMacroSettingRepository;
        this.currentUserContext = currentUserContext;
    }

    /** 查询碳循环宏量配置。 */
    public CycleMacroSettingsResponse getSettings() {
        AppUser user = currentUserContext.get();
        return new CycleMacroSettingsResponse(
                toResponse(getSetting(user, CycleType.HIGH, 4.5, 2, 0.6)),
                toResponse(getSetting(user, CycleType.MEDIUM, 3.3, 2, 0.75)),
                toResponse(getSetting(user, CycleType.LOW, 1.5, 2, 0.9)));
    }

    /** 保存碳循环宏量配置。 */
    @Transactional
    public CycleMacroSettingsResponse saveSettings(CycleMacroSettingsRequest request) {
        AppUser user = currentUserContext.get();
        saveSetting(user, CycleType.HIGH, request.high());
        saveSetting(user, CycleType.MEDIUM, request.medium());
        saveSetting(user, CycleType.LOW, request.low());
        return getSettings();
    }

    /** 获取已有配置或默认配置。 */
    private CycleMacroSetting getSetting(AppUser user, CycleType cycleType, double carbsPerKg, double proteinPerKg,
            double fatPerKg) {
        return cycleMacroSettingRepository.findByUserAndCycleType(user, cycleType)
                .orElse(new CycleMacroSetting(user, cycleType, carbsPerKg, proteinPerKg, fatPerKg));
    }

    /** 保存单个日型配置。 */
    private void saveSetting(AppUser user, CycleType cycleType, CycleMacroSettingRequest request) {
        CycleMacroSetting setting = cycleMacroSettingRepository.findByUserAndCycleType(user, cycleType)
                .orElseGet(() -> new CycleMacroSetting(user, cycleType, request.carbsPerKg(),
                        request.proteinPerKg(), request.fatPerKg()));
        setting.user = user;
        setting.carbsPerKg = request.carbsPerKg();
        setting.proteinPerKg = request.proteinPerKg();
        setting.fatPerKg = request.fatPerKg();
        cycleMacroSettingRepository.save(setting);
    }

    /** 转换配置响应。 */
    private CycleMacroSettingResponse toResponse(CycleMacroSetting setting) {
        return new CycleMacroSettingResponse(setting.carbsPerKg, setting.proteinPerKg, setting.fatPerKg);
    }
}
