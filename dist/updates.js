export const UPDATES=[
 {version:'1.7',title:'기존 인터페이스 복원과 해금 표시 수정',items:['1.6 인터페이스와 선택 테두리 복원, 구매 가능 상태만 흰색으로 변경','상단 UNBRIK 글씨에 기존 초록색 테마 적용','8섹터의 네 색 영역이 자리를 바꾸는 오팔 트위닝','미해금 섹터의 트리·내비게이터·통계 노출과 잘못된 이동 수정','애니메이션 설정 연동과 연속 연구 터치 시 텍스트 선택 방지']},
 {version:'1.6',title:'무채색 센터와 안정된 이동',items:['세 겹 삼각형 SVG 로고, 흰색·회색 센터와 7·8섹터 색상 변경','실제 면 방향으로 구분한 다면체 모서리와 팔각형을 따르는 궤도','섹터 아이콘 색상만 강조하는 무채색 내비게이터','이동 중 회색 버튼, 최종 상태 일괄 표시와 화면 맞춤 개선']},
 {version:'1.5',title:'센터와 인터페이스',items:['팔각형 센터, 회전하는 정십이면체와 옅은 궤도 효과','완료한 섹터를 표시하는 8개 색상 표시선','센터 선택 패널과 첫 연구 아이콘을 사용한 내비게이터','전체 보기 갱신 최적화, 접을 수 있는 업데이트 기록과 페이지 이동']},
 {version:'1.4',title:'UNBRIK 방사형 트리',items:['UNBRIK을 중심으로 펼쳐지는 다섯 갈래와 여덟 섹터','반복 업그레이드까지 완료한 섹터의 반투명 배경','센터에서 섹터 이동, 첫 접속 시 상단 정보 펼치기']},
 {version:'1.3.1',title:'무료 연구와 상단 화살표',items:['표시 가격을 유지하면서 자금 소모 없이 연구하는 치트','상단 접기·펼치기를 회전하는 화살표로 표시']},
 {version:'1.3',title:'접기·펼치기',items:['상단 정보와 선택한 연구의 접기·펼치기','닫기·확대 아이콘 수정과 테스트 설정 추가']},
 {version:'1.2',title:'아이콘과 성장 속도',items:['80개 연구의 내장 SVG 아이콘','일반 반복 연구는 다음 지역에서 마무리, 일부 연구는 후반까지 성장','오프라인 생산은 처음 30분 100%, 이후 지수 감쇠']},
];
export const UPDATE_PAGE_SIZE=2;
export function updatePage(page,entries=UPDATES){const pages=Math.max(1,Math.ceil(entries.length/UPDATE_PAGE_SIZE)),current=Math.max(1,Math.min(pages,Math.floor(Number(page)||1)));return {current,pages,entries:entries.slice((current-1)*UPDATE_PAGE_SIZE,current*UPDATE_PAGE_SIZE)};}
