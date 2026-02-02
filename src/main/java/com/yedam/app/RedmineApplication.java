package com.yedam.app;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan(basePackages = "com.yedam.app.**.mapper")
public class RedmineApplication {

	public static void main(String[] args) {
		SpringApplication.run(RedmineApplication.class, args);
	}

}
