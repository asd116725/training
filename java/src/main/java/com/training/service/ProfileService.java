package com.training.service;

import org.springframework.stereotype.Service;

import com.training.dto.ApiDtos.ProfileRequest;
import com.training.dto.ApiDtos.ProfileResponse;
import com.training.dto.ApiDtos.ProfileStatusResponse;
import com.training.model.AppUser;
import com.training.model.UserProfile;
import com.training.repository.UserProfileRepository;

/** 用户档案业务服务。 */
@Service
public class ProfileService {

    /** 用户档案仓库。 */
    private final UserProfileRepository userProfileRepository;

    /** 营养计算服务。 */
    private final NutritionService nutritionService;

    /** 当前用户上下文。 */
    private final CurrentUserContext currentUserContext;

    /** 创建用户档案服务。 */
    public ProfileService(UserProfileRepository userProfileRepository, NutritionService nutritionService,
            CurrentUserContext currentUserContext) {
        this.userProfileRepository = userProfileRepository;
        this.nutritionService = nutritionService;
        this.currentUserContext = currentUserContext;
    }

    /** 查询当前用户档案。 */
    public ProfileStatusResponse getProfile() {
        return userProfileRepository.findFirstByUserOrderByIdAsc(currentUserContext.get())
                .map(profile -> new ProfileStatusResponse(true, toResponse(profile)))
                .orElse(new ProfileStatusResponse(false, null));
    }

    /** 保存当前用户档案。 */
    public ProfileResponse saveProfile(ProfileRequest request) {
        AppUser user = currentUserContext.get();
        UserProfile profile = userProfileRepository.findFirstByUserOrderByIdAsc(user)
                .orElseGet(() -> new UserProfile(user, nutritionService.parseGender(request.gender()),
                        request.height(), request.weight(), request.age(), request.bodyFat(),
                        request.targetBodyFat(), request.activityLevel()));
        profile.user = user;
        profile.gender = nutritionService.parseGender(request.gender());
        profile.height = request.height();
        profile.weight = request.weight();
        profile.age = request.age();
        profile.bodyFat = request.bodyFat();
        profile.targetBodyFat = request.targetBodyFat();
        profile.activityLevel = request.activityLevel();
        return toResponse(userProfileRepository.save(profile));
    }

    /** 转换档案响应。 */
    private ProfileResponse toResponse(UserProfile profile) {
        return new ProfileResponse(profile.id, profile.gender.name().toLowerCase(), profile.height, profile.weight,
                profile.age, profile.bodyFat, profile.targetBodyFat, profile.activityLevel);
    }
}
