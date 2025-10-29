require('dotenv').config();

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 시트 이름과 범위 설정
const INPUT_SHEET_NAME_AND_RANGE = '입력!A2:F';
const MEMO_SHEET_NAME_AND_RANGE = '위촉문자!A2:D';
const ADMIN_SHEET_NAME_AND_RANGE = '설정!A2:B';

async function fetchData(filterDateString = null) {
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

    // 필터링 날짜 파싱 (yyyy-mm-dd 또는 mm/dd 등의 형식)
    let filterDate = null;
    if (filterDateString) {
      filterDate = parseSheetDate(filterDateString);
      if (filterDate) {
        console.log(`🔍 특정 날짜 '${formatDateISO(filterDate)}' 기준으로 데이터 필터링...`);
      } else {
        console.warn(`⚠️ 경고: 유효하지 않은 필터 날짜 '${filterDateString}'입니다. 모든 데이터를 가져옵니다.`);
      }
    } else {
        console.log('🔍 필터 날짜가 지정되지 않았습니다. 모든 데이터를 가져옵니다.');
    }


    // 데이터 파싱
    const adminSettings = parseAdminSettings(adminRows);
    const memoMap = buildMemoMap(memoRows);
    const schedules = parseSchedules(inputRows, memoMap, filterDate); // filterDate 전달
    const calendarEvents = parseCalendarEvents(inputRows, filterDate); // filterDate 전달

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

// 두 Date 객체가 같은 날짜인지 (UTC 기준) 확인하는 헬퍼 함수
function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.getUTCFullYear() === date2.getUTCFullYear() &&
         date1.getUTCMonth() === date2.getUTCMonth() &&
         date1.getUTCDate() === date2.getUTCDate();
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

// ✨ 수정된 부분: 차수 문자열을 비교를 위해 표준화하는 헬퍼 함수
function normalizeRoundForComparison(roundStr) {
    if (typeof roundStr !== 'string') return '';
    return roundStr
        .trim()
        .replace(/\s+/g, '') // 모든 공백 제거
        .replace(/[차치챠]$/, ''); // '차', '치', '챠'를 문자열 끝에서만 제거
}

// ✨ 수정된 부분: 차수를 더 유연하게 매칭하는 함수
// 콤마(,), 슬래시(/), 점(.)으로 구분된 여러 차수 중 하나라도 일치하면 매칭 성공
function matchRound(targetRound, roundField) {
  if (!targetRound || !roundField) return false;

  const normalizedTarget = normalizeRoundForComparison(targetRound);
  if (!normalizedTarget) return false; // 타겟 차수가 표준화 후 비어있으면 매칭 불가

  // roundField를 쉼표(,), 슬래시(/), 점(.) 기준으로 분리합니다.
  const potentialRoundSegments = String(roundField)
    .split(/[,/.]/) // <-- 점(.) 추가
    .map(segment => normalizeRoundForComparison(segment)); // 각 분리된 항목도 표준화

  // 어떤 분리된 항목이라도 표준화된 타겟 차수와 정확히 일치하는지 확인합니다.
  return potentialRoundSegments.some(segment => {
    return segment !== '' && segment === normalizedTarget;
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


function parseSchedules(inputRows, memoMap, filterDate = null) {
  if (!inputRows || inputRows.length === 0) return [];

  const scheduleMap = new Map();
  const roundKeyDates = new Map(); // 각 차수별 GP 오픈일과 마감일을 Date 객체로 저장

  // --- 1차 순회: 모든 차수의 GP 오픈일과 마감일(Date 객체)을 수집 ---
  // 이 단계에서 `filterDate`로 필터링하지 않고 모든 차수의 주요 날짜를 파악합니다.
  for (const row of inputRows) {
    const rawDate = row?.[0];
    const category = String(row?.[1] || '');
    const round = String(row?.[3] || '');
    const content = String(row?.[4] || '');

    const rowDate = parseSheetDate(rawDate);
    if (!rowDate) continue;

    // ✨ 수정: 차수 값 정규화 시, split 로직에도 점(.) 추가
    // D열의 값이 "1-1,1-2차" 라면 "1-1"만으로 차수 맵을 구성.
    // "1-1.1-2차" 라면 "1-1"만으로 차수 맵을 구성.
    // 'GP 오픈 예정'의 `round` 필드는 보통 단일 차수이거나, 여러 차수 중 첫 번째 차수를 대표하는 경우가 많으므로
    // `split(/[,/.]/)[0]`를 사용하여 첫 번째 차수만 키로 사용합니다.
    const primaryRoundForMap = normalizeRoundForComparison(round.trim().split(/[,/.]/)[0]);
    if (!primaryRoundForMap) continue;

    if (!roundKeyDates.has(primaryRoundForMap)) {
      roundKeyDates.set(primaryRoundForMap, { gpOpenDate: null, deadlineDate: null, gpOpenContent: '' });
    }

    // GP 오픈 예정일 추출
    if (category.includes('굿리치') && content.includes('GP 오픈 예정')) {
      roundKeyDates.get(primaryRoundForMap).gpOpenDate = rowDate;
      roundKeyDates.get(primaryRoundForMap).gpOpenContent = content; // 나중에 GP 오픈 시간 추출을 위해 원본 content 저장
    }
    // 자격추가/전산승인마감일 추출
    if (category.includes('굿리치') && content.includes('자격추가/전산승인마감')) {
      roundKeyDates.get(primaryRoundForMap).deadlineDate = rowDate;
    }
  }

  // --- 차수 필터링: filterDate에 해당하는 차수만 선별 ---
  let relevantRounds = new Set(); // 여기에 저장되는 것은 맵의 키 (예: '1-1', '1-2')
  if (filterDate) {
    for (const [roundName, dates] of roundKeyDates.entries()) {
      if (isSameDay(dates.gpOpenDate, filterDate) || isSameDay(dates.deadlineDate, filterDate)) {
        relevantRounds.add(roundName);
      }
    }
    if (relevantRounds.size === 0) {
        console.log(`   - 특정 날짜 '${formatDateISO(filterDate)}'에 해당하는 위촉일정 차수가 없습니다.`);
        return []; // 필터링된 차수가 없으면 빈 배열 반환
    }
  } else {
    // filterDate가 없으면 모든 차수가 관련 차수가 됨
    relevantRounds = new Set(roundKeyDates.keys());
  }

  // --- 2차 순회: 필터링된 차수를 기반으로 최종 schedules 객체 생성 및 보험사 정보 추가 ---
  // scheduleMap에는 relevantRounds의 항목들만 채워질 것입니다.
  for (const roundName of relevantRounds) {
    const dates = roundKeyDates.get(roundName);
    const gpOpenDateFormatted = formatDateWithDay(dates.gpOpenDate);
    const deadlineFormatted = formatDateWithDay(dates.deadlineDate);

    let gpOpenTime = '';
    const gpMatch = dates.gpOpenContent.match(/GP\s*오픈\s*예정\s*\(([^)]+)\)/);
    if (gpMatch && gpMatch[1]) {
        gpOpenTime = gpMatch[1];
    }

    scheduleMap.set(roundName, {
      round: roundName, // 맵의 키 (예: '1-1')가 최종 round 필드가 됩니다.
      deadline: deadlineFormatted,
      gpOpenDate: gpOpenDateFormatted,
      gpOpenTime: gpOpenTime,
      companies: [],
    });
  }

  // 이제 각 차수에 해당하는 보험사 정보를 채웁니다.
  // 이 루프에서는 inputRows의 모든 행을 다시 검사하여, 필터링된 차수에 맞는 보험사 정보를 찾습니다.
  for (const row of inputRows) {
    const rawDate = row?.[0]; // 위촉 접수마감일 (Acceptance Deadline)
    const category = String(row?.[1] || '');
    const company = String(row?.[2] || '');
    const sheetRoundValue = String(row?.[3] || ''); // D열의 원본 차수 값 (예: "1-1,1-2차" 또는 "1-1.1-2차")
    const gpUpload = row?.[5]; // GP 업로드일

    if (!category.includes('위촉') || !company) continue;

    // 필터링된 차수(relevantRounds)에 속하는지 확인
    // relevantRounds의 각 roundName (예: '1-1')이 sheetRoundValue (예: '1-1,1-2차')와 매칭되는지 확인
    for (const targetRoundNameFromRelevant of relevantRounds) {
      if (matchRound(targetRoundNameFromRelevant, sheetRoundValue) && scheduleMap.has(targetRoundNameFromRelevant)) {
        const sDate = parseSheetDate(rawDate);
        const gpUploadDate = parseSheetDate(gpUpload);
        const companyKey = company.trim().toLowerCase();
        const info = memoMap[companyKey] || { memo: '', manager: '' };

        scheduleMap.get(targetRoundNameFromRelevant).companies.push({
          company: company,
          round: targetRoundNameFromRelevant, // 이 보험사가 속한 차수는 필터링된 차수 이름 (예: '1-1')
          acceptanceDeadline: formatDateWithDay(sDate),
          gpUploadDate: formatDateWithDay(gpUploadDate),
          recruitmentMethod: info.memo,
          manager: info.manager,
        });
        break; // 해당 보험사는 하나의 차수에만 속한다고 가정하고 다음 행으로 넘어감
      }
    }
  }

  // 최종 결과를 날짜 순으로 정렬 (GP 오픈일 > 마감일)
  const sortedSchedules = Array.from(scheduleMap.values()).sort((a, b) => {
    // roundKeyDates는 모든 차수의 날짜 정보를 가지고 있으므로 여기서 가져옵니다.
    const datesA = roundKeyDates.get(a.round);
    const datesB = roundKeyDates.get(b.round);

    const dateA = datesA?.gpOpenDate || datesA?.deadlineDate;
    const dateB = datesB?.gpOpenDate || datesB?.deadlineDate;

    if (dateA && dateB) {
      return dateA.getTime() - dateB.getTime();
    }
    if (dateA) return -1; // dateA만 있으면 먼저
    if (dateB) return 1;  // dateB만 있으면 나중에
    return 0;
  });

  return sortedSchedules;
}


function parseCalendarEvents(inputRows, filterDate = null) {
  if (!inputRows || inputRows.length === 0) return [];

  const events = [];
  let eventId = 1;

  for (const row of inputRows) {
    const rawDate = row?.[0];
    const date = parseSheetDate(rawDate);
    if (!date) continue;

    // filterDate가 있을 경우, 해당 날짜와 일치하는 이벤트만 포함
    if (filterDate && !isSameDay(date, filterDate)) {
        continue;
    }

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

// 스크립트 실행 부분
// 환경 변수 FILTER_DATE를 읽어 fetchData에 전달합니다.
// 예시: FILTER_DATE=2023-10-26 node your_script_name.js
const filterDateFromEnv = process.env.FILTER_DATE;
fetchData(filterDateFromEnv).catch((error) => {
  console.error('예상치 못한 오류:', error);
  process.exit(1);
});
