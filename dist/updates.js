export const UPDATES=[
 {version:'1.5',title:'센터와 인터페이스',items:['팔각형 센터, 회전하는 정십이면체와 옅은 궤도 효과','완료한 섹터를 표시하는 8개 색상 표시선','센터 선택 패널과 첫 연구 아이콘을 사용한 내비게이터','전체 보기 갱신 최적화, 접을 수 있는 업데이트 기록과 페이지 이동']},
 {version:'1.4',title:'UNBRIK 방사형 트리',items:['UNBRIK을 중심으로 펼쳐지는 다섯 갈래와 여덟 섹터','반복 업그레이드까지 완료한 섹터의 반투명 배경','센터에서 섹터 이동, 첫 접속 시 상단 정보 펼치기']},
 {version:'1.3.1',title:'무료 연구와 상단 화살표',items:['표시 가격을 유지하면서 자금 소모 없이 연구하는 치트','상단 접기·펼치기를 회전하는 화살표로 표시']},
 {version:'1.3',title:'접기·펼치기',items:['상단 정보와 선택한 연구의 접기·펼치기','닫기·확대 아이콘 수정과 테스트 설정 추가']},
 {version:'1.2',title:'아이콘과 성장 속도',items:['80개 연구의 내장 SVG 아이콘','일반 반복 연구는 다음 지역에서 마무리, 일부 연구는 후반까지 성장','오프라인 생산은 처음 30분 100%, 이후 지수 감쇠']},
];
export const UPDATE_PAGE_SIZE=2;
export function updatePage(page,entries=UPDATES){const pages=Math.max(1,Math.ceil(entries.length/UPDATE_PAGE_SIZE)),current=Math.max(1,Math.min(pages,Math.floor(Number(page)||1)));return {current,pages,entries:entries.slice((current-1)*UPDATE_PAGE_SIZE,current*UPDATE_PAGE_SIZE)};}
