package com.yedam.app.gantt.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.gantt.mapper.GanttMapper;
import com.yedam.app.gantt.service.GanttService;
import com.yedam.app.gantt.service.GanttVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class GanttServiceImpl implements GanttService {

	private final GanttMapper ganttMapper;
	
	// 전체조회
	@Override
	public List<GanttVO> findAll() {
		return ganttMapper.selectAll();
	}

}
