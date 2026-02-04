package com.yedam.app.gantt.service;

import java.util.List;
import java.util.Map;

public interface GanttService {
	
	// 전체조회
	public List<Map<String, Object>> getGanttList(GanttVO ganttVO);
}
