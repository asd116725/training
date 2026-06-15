package com.training.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.training.model.InviteCode;
import com.training.repository.InviteCodeRepository;

/** 邀请码初始化器。 */
@Component
public class InviteCodeSeedRunner implements ApplicationRunner {

    /** 邀请码仓库。 */
    private final InviteCodeRepository inviteCodeRepository;

    /** 环境变量配置的邀请码。 */
    private final String inviteCodes;

    /** 创建邀请码初始化器。 */
    public InviteCodeSeedRunner(InviteCodeRepository inviteCodeRepository,
            @Value("${app.invite-codes:}") String inviteCodes) {
        this.inviteCodeRepository = inviteCodeRepository;
        this.inviteCodes = inviteCodes;
    }

    /** 启动后幂等写入邀请码。 */
    @Override
    public void run(ApplicationArguments args) {
        inviteCodes.lines()
                .flatMap(line -> Arrays.stream(line.split(",")))
                .map(String::trim)
                .filter(code -> !code.isBlank())
                .distinct()
                .filter(code -> !inviteCodeRepository.existsByCode(code))
                .map(InviteCode::new)
                .forEach(inviteCodeRepository::save);
    }
}
