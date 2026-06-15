package com.training.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.training.model.InviteCode;

import jakarta.persistence.LockModeType;

/** 邀请码仓库。 */
public interface InviteCodeRepository extends JpaRepository<InviteCode, Long> {

    /** 按邀请码查询。 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<InviteCode> findByCode(String code);

    /** 判断邀请码是否存在。 */
    boolean existsByCode(String code);
}
