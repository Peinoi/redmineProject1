package com.yedam.app.gantt.mapper;

import java.util.List;

import com.yedam.app.gantt.service.GanttVO;

public interface GanttMapper {
	
	// 전체조회
	public List<GanttVO> selectAll();
	
}
