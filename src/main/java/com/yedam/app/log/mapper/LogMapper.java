package com.yedam.app.log.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.log.service.LogVO;

public interface LogMapper {
	int insertLog(LogVO log);
	
	List<LogVO> selectLogsByTarget(@Param("targetType") String targetType,
            @Param("targetCode") Long targetCode);
}
