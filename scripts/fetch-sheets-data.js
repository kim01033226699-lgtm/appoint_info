require('dotenv').config();

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 시트 이름과 범위 설정
const INPUT_SHEET_NAME_AND_RANGE = '입력!A2:F';
const MEMO_SHEET_NAME_AND_RANGE = '위촉문자!A2:D';
const ADMIN_SHEET_NAME_AND_RANGE = '설정!A2:B';

async function fetchData() {
  try {
    console.log('🔄 구글 시트에서 데이터를 가져오는 중...');

    // API 키 방식과 서비스 계정 방식 모두 지원
    const useApiKey = !!process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID 또는 GOOGLE_SHEET_ID가 설정되지 않았습니다.');
    }

    let sheets;

    if (useApiKey) {
      // API 키 방식
      console.log('📋 API 키 방식으로 연결 중...');
      const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
      sheets = google.sheets({ version: 'v4', auth: apiKey });
    } else {
      // 서비스 계정 방식
      console.log('🔑 서비스 계정 방식으로 연결 중...');
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      sheets = google.sheets({ version: 'v4', auth });
    }

    // 데이터 가져오기
    const [adminRes, inputRes, memoRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: ADMIN_SHEET_NAME_AND_RANGE,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: INPUT_SHEET_NAME_AND_RANGE,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: MEMO_SHEET_NAME_AND_RANGE,
      }),
    ]);

    const adminRows = adminRes?.data?.values;
    const inputRows = inputRes?.data?.values;
    const memoRows = memoRes?.data?.values;

    // 데이터 파싱
    const adminSettings = parseAdminSettings(adminRows);
    const memoMap = buildMemoMap(memoRows);
    const schedules = parseSchedules(inputRows, memoMap);
    const calendarEvents = parseCalendarEvents(inputRows);

    const data = {
      requiredDocuments: adminSettings.guidance,
      checklist: adminSettings.checklist,
      schedules: schedules,
      calendarEvents: calendarEvents,
    };

    // public/data.json에 저장
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(publicDir, 'data.json'),
      JSON.stringify(data, null, 2),
      'utf-8'
    );

    console.log('✅ 구글 시트 데이터를 성공적으로 가져왔습니다!');
    console.log(`   - 필요서류: ${data.requiredDocuments.substring(0, 30)}...`);
    console.log(`   - 체크리스트: ${data.checklist.length}개 항목`);
    console.log(`   - 위촉일정: ${data.schedules.length}개 차수`);
    console.log(`   - 캘린더 이벤트: ${data.calendarEvents.length}개`);
  } catch (error) {
    console.error('❌ 데이터 가져오기 실패:', error.message);
    process.exit(1);
  }
}

// 날짜 파싱 함수 (제공된 코드 기반)
function parseSheetDate(value) {
  try {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }

    if (typeof value === 'number') {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + value * 86400000);
      if (!isNaN(date.getTime())) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      }
    }

    if (typeof value === 'string') {
      const dateStr = value.trim();
      if (!dateStr) return null;

      const shortFormatMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
      if (shortFormatMatch) {
        const [, month, day] = shortFormatMatch.map(p => parseInt(p, 10));
        const currentYear = new Date().getFullYear();
        const d = new Date(Date.UTC(currentYear, month - 1, day));
        if (d.getUTCFullYear() === currentYear && d.getUTCMonth() === month - 1 && d.getUTCDate() === day) {
          return d;
        }
      }

      const parts = dateStr.split(/[.\-\/]/).map(p => parseInt(p, 10));
      if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        let [year, month, day] = parts;
        if (year < 100) {
          year += 2000;
        }
        if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const d = new Date(Date.UTC(year, month - 1, day));
          if (d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day) {
            return d;
          }
        }
      }

      const directParse = new Date(dateStr);
      if (!isNaN(directParse.getTime())) {
        return new Date(Date.UTC(directParse.getUTCFullYear(), directParse.getUTCMonth(), directParse.getUTCDate()));
      }
    }

    return null;
  } catch (error) {
    console.warn(`날짜 파싱 실패: '${value}'. 오류: ${error}`);
    return null;
  }
}

function formatDateWithDay(date) {
  if (!date) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}(${days[date.getUTCDay()]})`;
}

function formatDateISO(date) {
  if (!date) return '';
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function matchRound(targetRound, roundField) {
  if (!targetRound || !roundField) return false;

  // 타겟 차수 정규화: "9-4차" -> "9-4"
  const normalizedTargetRound = targetRound.trim()
    .replace(/\s/g, '') // 공백 제거
    .replace(/[차치]/g, ''); // "차", "치" 제거 (끝뿐만 아니라 모든 위치)

  // 입력 필드 정규화
  const normalizedField = String(roundField)
    .replace(/\s/g, '') // 공백 제거
    .replace(/[차치]/g, '') // "차", "치" 모두 제거 (split 전에!)
    .replace(/[/|]/g, ','); // "/" 또는 "|"를 ","로 변환

  // 쉼표로 분리
  const roundList = normalizedField.split(',').filter(r => r.trim() !== '');

  return roundList.some(r => {
    const normalizedRoundItem = r.trim();
    return normalizedRoundItem !== '' && normalizedRoundItem === normalizedTargetRound;
  });
}

function buildMemoMap(memoRows) {
  const map = {};
  if (!memoRows) return map;

  for (const row of memoRows) {
    const company = (row?.[0] || '').toString().trim().toLowerCase();
    if (!company) continue;
    const memo = (row?.[1] || '').toString().trim();
    const managerName = (row?.[2] || '').toString().trim();
    const phone = (row?.[3] || '').toString().trim();
    map[company] = {
      memo: memo,
      manager: managerName && phone ? `${managerName} (${phone})` : managerName || ''
    };
  }
  return map;
}

function parseAdminSettings(rows) {
  const defaults = {
    checklist: [
      { id: '1', text: '위촉서류 제출' },
      { id: '2', text: '굿리치 앱 설치 및 프로필 설정' },
    ],
    guidance: '환영합니다! 굿리치 전문가로의 첫 걸음을 응원합니다.',
  };

  if (!rows) return defaults;

  const settings = {
    checklist: [],
    guidance: '',
  };

  rows.forEach((row, index) => {
    const key = (row?.[0] || '').toString().trim().replace(/`/g, '');
    const value = (row?.[1] || '').toString().trim();
    if (!key || !value) return;

    switch (key) {
      case '위촉필요서류':
        settings.guidance = value;
        break;
      case '체크리스트':
        settings.checklist.push({ id: `${settings.checklist.length + 1}`, text: value });
        break;
    }
  });

  return {
    checklist: settings.checklist.length > 0 ? settings.checklist : defaults.checklist,
    guidance: settings.guidance || defaults.guidance,
  };
}

function parseSchedules(inputRows, memoMap) {
  if (!inputRows || inputRows.length === 0) return [];

  const scheduleMap = new Map();

  // 굿리치 일정에서 차수와 GP 오픈 일정 추출
  for (const row of inputRows) {
    const rawDate = row?.[0];
    const category = String(row?.[1] || '');
    const round = String(row?.[3] || '');
    const content = String(row?.[4] || '');

    if (!category.includes('굿리치')) continue;
    if (!content.includes('GP 오픈 예정')) continue;

    const rowDate = parseSheetDate(rawDate);
    if (!rowDate) continue;

    // 차수를 분리: "11-1,11-2차" → ["11-1", "11-2"]
    const normalizedRound = round.trim()
      .replace(/\s/g, '')
      .replace(/[차치]/g, '')
      .replace(/[/|]/g, ',');
    const targetRounds = normalizedRound.split(',').filter(r => r.trim() !== '');

    // 각 차수마다 schedule 등록
    for (const targetRound of targetRounds) {
      if (!scheduleMap.has(targetRound)) {
        // GP 오픈 일정 추출
        const lines = content.split('\n');
        const gpLine = lines.find(line => line.includes('GP 오픈 예정'));
        let gpOpenDate = '';
        let gpOpenTime = '';

        if (gpLine) {
          const match = gpLine.match(/(\d{1,2}\/\d{1,2}\([일월화수목금토]\))\s*GP\s*오픈\s*예정\s*\(([^)]+)\)/);
          if (match) {
            gpOpenDate = match[1];
            gpOpenTime = match[2];
          }
        }

        // 마감일 추출
        let deadline = '';
        const deadlineContent = inputRows.find(r => {
          const c = String(r?.[1] || '');
          const rnd = String(r?.[3] || '');
          const cnt = String(r?.[4] || '');
          return c.includes('굿리치') && matchRound(targetRound, rnd) && cnt.includes('자격추가/전산승인마감');
        });

        if (deadlineContent) {
          const deadlineDate = parseSheetDate(deadlineContent[0]);
          if (deadlineDate) {
            deadline = formatDateWithDay(deadlineDate);
          }
        }

        scheduleMap.set(targetRound, {
          round: targetRound,
          deadline: deadline,
          gpOpenDate: gpOpenDate,
          gpOpenTime: gpOpenTime,
          companies: [],
        });
      }
    }
  }

  // 생명보험사 위촉 일정 추가
  for (const row of inputRows) {
    const rawDate = row?.[0];
    const category = String(row?.[1] || '');
    const company = String(row?.[2] || '');
    const round = String(row?.[3] || '');
    const gpUpload = row?.[5];

    if (!category.includes('위촉')) continue;
    if (!company) continue;

    const targetRounds = Array.from(scheduleMap.keys());
    for (const targetRound of targetRounds) {
      if (matchRound(targetRound, round)) {
        const sDate = parseSheetDate(rawDate);
        const companyKey = company.trim().toLowerCase();
        const info = memoMap[companyKey] || { memo: '', manager: '' };

        scheduleMap.get(targetRound).companies.push({
          company: company,
          round: targetRound,
          acceptanceDeadline: formatDateWithDay(sDate),
          gpUploadDate: formatDateWithDay(parseSheetDate(gpUpload)),
          recruitmentMethod: info.memo,
          manager: info.manager,
        });
        // break 제거: 모든 매칭되는 차수에 추가
      }
    }
  }

  return Array.from(scheduleMap.values());
}

function parseCalendarEvents(inputRows) {
  if (!inputRows || inputRows.length === 0) return [];

  const events = [];
  let eventId = 1;

  for (const row of inputRows) {
    const rawDate = row?.[0];
    const date = parseSheetDate(rawDate);
    if (!date) continue;

    const category = String(row?.[1] || '').trim();
    const company = String(row?.[2] || '').trim();
    const content = String(row?.[4] || '').trim();

    if (!content) continue;

    // 타이틀 생성
    const titlePrefix = [category, company].filter(Boolean).join(' ');
    const title = [titlePrefix, content].filter(Boolean).join(' - ');

    // 타입 결정
    let type = 'company';
    if (category.includes('굿리치')) {
      type = 'goodrich';
    } else if (category.includes('세종') || category.includes('협회')) {
      type = 'session';
    }

    events.push({
      id: String(eventId++),
      date: formatDateISO(date),
      title: title,
      type: type,
    });
  }

  return events;
}

fetchData().catch((error) => {
  console.error('예상치 못한 오류:', error);
  process.exit(1);
});
