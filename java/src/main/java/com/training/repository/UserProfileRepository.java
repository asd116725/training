package com.training.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.training.model.AppUser;
import com.training.model.UserProfile;

/** 用户档案仓库。 */
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    /** 查询当前用户档案。 */
    Optional<UserProfile> findFirstByUserOrderByIdAsc(AppUser user);
}
