package com.yedam.app.gantt.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.gantt.service.GanttVO;

public interface GanttMapper {
	
	// 로그인 유저의 프로젝트 / 타입 / 일감 전체 목록
	public List<GanttVO> selectGanttList(@Param("userCode") Integer userCode, GanttVO ganttVO);
	
}
