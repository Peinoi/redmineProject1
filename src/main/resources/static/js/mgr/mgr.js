const draggables = document.querySelectorAll(".draggable");
const container = document.querySelector("#recommend-list"); // row를 타겟으로 변경

draggables.forEach(draggable => {
  draggable.addEventListener("dragstart", () => {
    draggable.classList.add("dragging");
  });

  draggable.addEventListener("dragend", () => {
    draggable.classList.remove("dragging");
  });
});

container.addEventListener("dragover", e => {
  e.preventDefault();
  const draggable = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(container, e.clientX);
  
  if (afterElement == null) {
    container.appendChild(draggable);
  } else {
    container.insertBefore(draggable, afterElement);
  }
});

function getDragAfterElement(container, x) {
  // dragging 클래스를 제외한 나머지 카드들 추출
  const draggableElements = [...container.querySelectorAll(".draggable:not(.dragging)")];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    // 요소의 중심점과 현재 마우스 위치의 거리 계산
    const offset = x - box.left - box.width / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}