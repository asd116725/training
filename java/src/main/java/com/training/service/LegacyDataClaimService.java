package com.training.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.training.model.AppUser;
import com.training.repository.CycleMacroSettingRepository;
import com.training.repository.MealLogRepository;
import com.training.repository.RecommendationPromptRepository;
import com.training.repository.RecommendationRecordRepository;
import com.training.repository.UserProfileRepository;

/** 首个注册用户认领历史数据服务。 */
@Service
public class LegacyDataClaimService {

    /** 用户档案仓库。 */
    private final UserProfileRepository userProfileRepository;

    /** 餐食日志仓库。 */
    private final MealLogRepository mealLogRepository;

    /** 碳循环配置仓库。 */
    private final CycleMacroSettingRepository cycleMacroSettingRepository;

    /** 推荐提示词仓库。 */
    private final RecommendationPromptRepository recommendationPromptRepository;

    /** 推荐记录仓库。 */
    private final RecommendationRecordRepository recommendationRecordRepository;

    /** 创建历史数据认领服务。 */
    public LegacyDataClaimService(
            UserProfileRepository userProfileRepository,
            MealLogRepository mealLogRepository,
            CycleMacroSettingRepository cycleMacroSettingRepository,
            RecommendationPromptRepository recommendationPromptRepository,
            RecommendationRecordRepository recommendationRecordRepository) {
        this.userProfileRepository = userProfileRepository;
        this.mealLogRepository = mealLogRepository;
        this.cycleMacroSettingRepository = cycleMacroSettingRepository;
        this.recommendationPromptRepository = recommendationPromptRepository;
        this.recommendationRecordRepository = recommendationRecordRepository;
    }

    /** 认领旧版无归属数据。 */
    @Transactional
    public void claimForFirstUser(AppUser user) {
        userProfileRepository.findAll().stream()
                .filter(profile -> profile.user == null)
                .forEach(profile -> profile.user = user);
        mealLogRepository.findAll().stream()
                .filter(mealLog -> mealLog.user == null)
                .forEach(mealLog -> mealLog.user = user);
        cycleMacroSettingRepository.findAll().stream()
                .filter(setting -> setting.user == null)
                .forEach(setting -> setting.user = user);
        recommendationPromptRepository.findAll().stream()
                .filter(prompt -> prompt.user == null)
                .forEach(prompt -> prompt.user = user);
        recommendationRecordRepository.findAll().stream()
                .filter(record -> record.user == null)
                .forEach(record -> record.user = user);
    }
}
