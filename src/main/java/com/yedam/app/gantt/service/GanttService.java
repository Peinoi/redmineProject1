package com.yedam.app.gantt.service;

import java.util.List;

public interface GanttService {
	
	// 전체조회
	public List<GanttVO> getGanttList(Integer userCode, GanttVO ganttVO);
}
