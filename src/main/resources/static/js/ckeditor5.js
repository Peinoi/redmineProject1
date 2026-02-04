
// 페이지가 로드된 후 실행
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

		// 만약 Vue의 props.readOnly처럼 읽기 전용 모드가 필요하다면:
		// const isReadOnly = [[${readOnly}]]; // 서버에서 전달받은 값
		// if (isReadOnly) editor.enableReadOnlyMode('editor');
	})
	.catch(error => {
		console.error('에디터 초기화 실패:', error);
	});
