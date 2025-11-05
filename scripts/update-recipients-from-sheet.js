const fs = require('fs');
const path = require('path');

// 구글 시트에서 가져온 수신처 데이터
const sheetRecipients = [
  {
    "company": "생명보험협회",
    "address": "서울특별시 중구 퇴계로 173, 16층(충무로3가)"
  },
  {
    "company": "손해보험협회",
    "address": "서울특별시 종로구 종로1길 50 15층 B동(케이트윈타워) 손해보험협회 자격관리팀"
  },
  {
    "company": "글로벌금융판매",
    "address": "서울특별시 영등포구 경인로 775 1-511 (문래동3가, 에이스하이테크시티"
  },
  {
    "company": "디비금융서비스",
    "address": "서울특별시 강남구 테헤란로 8길 37, 4층(역삼동, 한동빌딩)"
  },
  {
    "company": "메트라이프금융서비스",
    "address": "서울특별시 강남구 영동대로 96길 8, 석광빌딩 3층"
  },
  {
    "company": "삼성생명금융서비스",
    "address": "서울특별시 강남구 테헤란로4길 14, 10층(미림타워)"
  },
  {
    "company": "신한금융플러스",
    "address": "서울특별시 영등포구 영등포로 256 우성타워 B동 8층"
  },
  {
    "company": "아이에프에이",
    "address": "서울특별시 강남구 테헤란로 22길 14 중유빌딩 (역삼동)"
  },
  {
    "company": "에이아이지어드바이저",
    "address": "서울특별시 마포구 마포대로 92, 5층(도화동, 효성해링턴스퀘어 A동)"
  },
  {
    "company": "에이플러스에셋",
    "address": "서울특별시 서초구 강남대로 369 12층 (서초동, 에이플러스에셋타워)"
  },
  {
    "company": "영진에셋",
    "address": "부산광역시 연제구 중앙대로 1093 15층 (영진에셋빌딩)"
  },
  {
    "company": "키움에셋플래너",
    "address": "서울특별시 강남구 영동대로 424 사조빌딩 5층 (대치동)"
  },
  {
    "company": "한화생명금융서비스",
    "address": "서울특별시 영등포구 63로 50 (여의도동, 63 한화생명빌딩)"
  },
  {
    "company": "HK금융파트너스",
    "address": "서울특별시 강남구 테헤란로 101, 5층 (역삼동, HK타워)"
  },
  {
    "company": "KB라이프파트너스",
    "address": "서울특별시 강남구 강남대로 314, 서우빌딩 5층"
  }
];

// data.json 로드
const dataPath = path.join(__dirname, '..', 'public', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// schedules에서 회사 목록 추출 (보험사 이름들)
const insuranceCompanies = new Set();
data.schedules.forEach(s => s.companies.forEach(c => {
  insuranceCompanies.add(c.company);
}));

console.log('📊 데이터 현황:');
console.log(`   - 구글 시트 수신처: ${sheetRecipients.length}개`);
console.log(`   - schedules의 보험사: ${insuranceCompanies.size}개`);

// 최종 recipients 생성
const finalRecipients = [];

// 1. 구글 시트 수신처 추가
sheetRecipients.forEach(r => {
  finalRecipients.push(r);
});

// 2. schedules의 보험사 중 구글 시트에 없는 회사 추가
Array.from(insuranceCompanies).forEach(company => {
  const exists = sheetRecipients.some(r =>
    r.company.includes(company) || company.includes(r.company)
  );
  if (!exists) {
    finalRecipients.push({
      company: company,
      address: '주소 미입력 - 구글시트 수신처 탭에서 주소를 입력해주세요'
    });
  }
});

// data.json 업데이트
data.recipients = finalRecipients;
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

console.log('\n✅ recipients 업데이트 완료!');
console.log(`   총 ${finalRecipients.length}개 수신처 등록`);
console.log('\n📋 등록된 수신처:');
finalRecipients.forEach((r, i) => {
  const hasAddress = r.address && !r.address.includes('주소 미입력');
  console.log(`   ${i + 1}. ${r.company} ${hasAddress ? '✓' : '⚠ (주소 미입력)'}`);
});
