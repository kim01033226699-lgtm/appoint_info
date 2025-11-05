const fs = require('fs');
const path = require('path');

// data.json 로드
const dataPath = path.join(__dirname, '..', 'public', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// schedules에서 회사 목록 추출
const companies = new Set();
data.schedules.forEach(s => s.companies.forEach(c => companies.add(c.company)));

// 기존 recipients 유지 (협회들)
const existingRecipients = data.recipients || [];
const existingCompanyNames = existingRecipients.map(r => r.company);

// 새로운 회사들 추가 (주소는 '주소 미입력'으로)
const newRecipients = Array.from(companies)
  .filter(company => !existingCompanyNames.includes(company))
  .map(company => ({
    company: company,
    address: '주소 미입력 - 구글시트 설정 탭에서 주소를 입력해주세요'
  }));

// 기존 + 새로운 회사들 합치기
data.recipients = [...existingRecipients, ...newRecipients];

// data.json 저장
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

console.log('✅ recipients 업데이트 완료!');
console.log(`   기존: ${existingRecipients.length}개`);
console.log(`   추가: ${newRecipients.length}개`);
console.log(`   합계: ${data.recipients.length}개`);
console.log('');
console.log('추가된 회사:');
newRecipients.forEach((r, i) => {
  console.log(`   ${i + 1}. ${r.company}`);
});
