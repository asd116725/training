package com.training.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.training.model.AppUser;

/** 应用用户仓库。 */
public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    /** 按手机号查询用户。 */
    Optional<AppUser> findByPhone(String phone);

    /** 判断手机号是否已注册。 */
    boolean existsByPhone(String phone);
}
