package com.yedam.app.gantt.mapper;

import java.util.List;
import java.util.Map;

import com.yedam.app.gantt.service.GanttVO;

public interface GanttMapper {
	
	// 전체조회
	public List<Map<String, Object>> selectGanttList(GanttVO ganttVO);
	
}
