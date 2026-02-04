package com.yedam.app.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.yedam.app.common.interceptor.LoginCheckInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new LoginCheckInterceptor())
		.addPathPatterns("/**") // 전체 요청에 적용
		.excludePathPatterns(
				"/login",       // 로그인 관련은 예외
                "/error",       // 에러페이지 예외
				"/css/**", "/js/**", "/images/**", "/webjars/**", "/favicon.ico"
				);
	}

	
}
