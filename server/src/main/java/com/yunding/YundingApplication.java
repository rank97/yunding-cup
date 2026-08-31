package com.yunding;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.yunding.mapper")
public class YundingApplication {

    public static void main(String[] args) {
        SpringApplication.run(YundingApplication.class, args);
    }
}
