package com.training.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.training.dto.ApiDtos.CycleMacroSettingsRequest;
import com.training.dto.ApiDtos.CycleMacroSettingsResponse;
import com.training.service.CycleMacroSettingService;

import jakarta.validation.Valid;

/** 碳循环宏量配置接口。 */
@RestController
@RequestMapping("/api/cycle-macros")
public class CycleMacroSettingController {

    /** 碳循环宏量配置服务。 */
    private final CycleMacroSettingService cycleMacroSettingService;

    /** 创建碳循环宏量配置接口。 */
    public CycleMacroSettingController(CycleMacroSettingService cycleMacroSettingService) {
        this.cycleMacroSettingService = cycleMacroSettingService;
    }

    /** 查询碳循环宏量配置。 */
    @GetMapping
    public CycleMacroSettingsResponse getSettings() {
        return cycleMacroSettingService.getSettings();
    }

    /** 保存碳循环宏量配置。 */
    @PostMapping
    public CycleMacroSettingsResponse saveSettings(@Valid @RequestBody CycleMacroSettingsRequest request) {
        return cycleMacroSettingService.saveSettings(request);
    }
}
