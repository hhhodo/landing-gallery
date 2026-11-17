# Custom Section Widgets (5종)

랜딩 페이지 섹션 중 **스크롤 애니메이션이 없는** 섹션 5개를 골라, 오른쪽 상단 **조작 패널**로 직접 커스텀할 수 있는 위젯으로 만들었다. 각 HTML 파일을 브라우저로 열면 바로 동작한다 (서버/빌드 불필요).

| 위젯 | 파일 | 원본 섹션 | 조작 가능 항목 |
|---|---|---|---|
| FAQ 아코디언 | `faq-accordion.html` | amble `.faq` | 질문/답변 추가·삭제·편집, 하나만 열기, 펼침 애니메이션, 라인/카드 형태, +/화살표 아이콘, 색·크기·여백 |
| 요금제 | `pricing-plans.html` | amble `.plans` | 플랜 추가·삭제·편집, 강조 플랜 변경, 열 수, 뱃지/혜택 표시, 카드 띄우기, 색·모서리·간격 |
| 리뷰 | `reviews.html` | amble `.testimonials` | 리뷰 추가·삭제·편집, 그리드/슬라이더(버튼), 별점·아바타 표시, 열 수, 색·크기 |
| 프로세스 단계 | `process-steps.html` | amble `.process` | 단계 추가·삭제·편집, 가로/세로, 번호 아이콘·STEP 라벨·연결선, 색·크기 |
| 혜택 그리드 | `benefits-grid.html` | amble `.benefits` | 카드 추가·삭제·편집, 열 수, 아이콘·테두리·호버 효과, 색·크기 |

## 조작 방법
- **텍스트 직접 편집** 토글을 켜면 화면의 글자를 클릭해서 바로 수정 (아이콘 칸도 이모지/문자로 교체 가능).
- 색/슬라이더/토글은 즉시 반영. **초기화**로 원복.
- **설정 복사(JSON)**: 현재 설정 + 편집한 텍스트를 JSON으로 복사 → 최종 값 전달/저장용.

## 구조
- `shared/panel.js`, `shared/panel.css` — 공용 조작 패널 (`CWPanel.mount({...})`).
- 위젯은 `.xx-w` 루트의 **CSS 변수(`--fw-*`, `--pw-*` …)** 와 **`data-*` 속성**으로 스타일을 받는다. 호스트 프로젝트에 넣을 땐 패널 없이 변수만 오버라이드하면 된다.

## 선정/제외 기준
- 스크롤 연동 섹션은 전부 제외: 스크롤 리빌(`.reveal`), 카운트업 숫자(trust/stats), 스크롤 핀·가로스크롤(onair collage, carebridge features/cards), 글자 reveal, 스크롤 물리(badge-drop).
- 위젯에는 IntersectionObserver / scroll 이벤트 / reveal 클래스가 없다 (클릭·입력에만 반응). 원본 amble 섹션에 걸려 있던 `.reveal`은 제거함.
- 원본 문구는 amble 랜딩 기준 샘플 텍스트 (편집 가능).
