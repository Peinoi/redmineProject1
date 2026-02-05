// 페이지가 로드된 후 실행
// 전역 변수로 CKEditor 인스턴스 노출
window.ckEditor = null;

ClassicEditor
	.create(document.querySelector('#editor'), {

		licenseKey: 'GPL',
		toolbar: [
		    'undo', 'redo', '|', 'heading', 'bold', 'italic', '|',
		    'insertTable', '|',
		    'bulletedList', 'numberedList', '|', 'selectAll'
		],

		table: {
			contentToolbar: [
				'tableColumnResize', 'tableProperties', 'tableCellProperties', 'toggleTableCaption'
			]
		},
		// 한국어 설정 (필요 시)
		language: 'ko'
	})
	.then(editor => {
		console.log('Editor was initialized');
		
		// 전역 변수에 에디터 인스턴스 저장
		window.ckEditor = editor;

	
	})
	.catch(error => {
		console.error('에디터 초기화 실패:', error);
	});