package com.training.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Web MVC 配置。 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /** API 登录拦截器。 */
    private final AuthInterceptor authInterceptor;

    /** 创建 Web MVC 配置。 */
    public WebConfig(AuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    /** 注册拦截器。 */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor).addPathPatterns("/api/**");
    }
}
