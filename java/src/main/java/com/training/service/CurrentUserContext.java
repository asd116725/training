package com.training.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.training.model.AppUser;

/** 当前请求用户上下文。 */
@Component
public class CurrentUserContext {

    /** 当前线程用户。 */
    private final ThreadLocal<AppUser> currentUser = new ThreadLocal<>();

    /** 设置当前用户。 */
    public void set(AppUser user) {
        currentUser.set(user);
    }

    /** 获取当前用户。 */
    public AppUser get() {
        AppUser user = currentUser.get();

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录");
        }

        return user;
    }

    /** 清理当前用户。 */
    public void clear() {
        currentUser.remove();
    }
}
