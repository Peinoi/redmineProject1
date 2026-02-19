package com.yedam.app.usermgr.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.project.service.PruserVO;
import com.yedam.app.usermgr.service.UsermgrService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class UsermgrController {

    private final UsermgrService usermgrService;

    // 사용자 리스트
    @GetMapping("usermgr")
    public String userAllList(Model model) {
        List<PruserVO> users  = usermgrService.userFindAll();
        PruserVO nextNo = usermgrService.selectNextNo(); 

        model.addAttribute("users",  users);
        model.addAttribute("nextNo", nextNo);
        return "usermgr/usermgrlist";
    }

    // 사용자 등록
    @PostMapping("useradd")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addUser(@RequestBody PruserVO pruserVO) {
        Map<String, Object> result = new HashMap<>();
        try {
            int inserted = usermgrService.insertUser(pruserVO);
            result.put("success", inserted > 0);
            result.put("message", inserted > 0 ? "사용자가 등록되었습니다." : "등록에 실패했습니다.");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "오류: " + e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    // 잠금 / 잠금해제
    @PostMapping("userlock")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> lockUser(@RequestBody PruserVO pruserVO) {
        Map<String, Object> result = new HashMap<>();
        try {
            int updated = usermgrService.lockUpdateUser(pruserVO.getIsLock(), pruserVO.getUserCode());
            result.put("success", updated > 0);
            result.put("message", updated > 0
                ? ("1".equals(pruserVO.getIsLock()) ? "비활성화(잠금) 처리되었습니다." : "활성화(잠금 해제) 처리되었습니다.")
                : "처리에 실패했습니다.");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "오류: " + e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    // 소프트 삭제
    @PostMapping("userdelete")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteUser(@RequestBody PruserVO pruserVO) {
        Map<String, Object> result = new HashMap<>();
        try {
            int deleted = usermgrService.deleteUser(pruserVO.getUserCode());
            result.put("success", deleted > 0);
            result.put("message", deleted > 0 ? "삭제되었습니다." : "삭제에 실패했습니다.");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "오류: " + e.getMessage());
        }
        return ResponseEntity.ok(result);
    }
}