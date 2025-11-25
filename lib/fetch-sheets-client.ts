/**
 * 클라이언트에서 Google Sheets를 직접 가져오는 함수
 * GitHub Pages 같은 정적 호스팅에서도 작동합니다.
 */

const SPREADSHEET_ID = '1y3-9-GswYKhSYGKHo_3yMGZvO3EHO2bzfJKkG2MNedQ';

const SHEET_NAMES = {
  INPUT: '입력',
  MEMO: '위촉문자',
  ADMIN: '설정'
};

async function fetchSheetAsCSV(spreadsheetId: string, sheetName: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.statusText}`);
  }

  return response.text();
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentField);
      if (currentRow.some(field => field.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else if (char === '\r') {
      continue;
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(field => field.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseSheetDate(value: any): Date | null {
  try {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      const dateStr = value.trim();
      if (!dateStr) return null;

      // "2025. 11. 25" 형식
      const dotFormatMatch = dateStr.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})$/);
      if (dotFormatMatch) {
        const [, year, month, day] = dotFormatMatch;
        const d = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        return d;
      }

      // "11/25" 형식
      const shortFormatMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
      if (shortFormatMatch) {
        const [, month, day] = shortFormatMatch;
        const currentYear = new Date().getFullYear();
        const d = new Date(Date.UTC(currentYear, parseInt(month) - 1, parseInt(day)));
        return d;
      }

      // 기본 파싱 시도
      const parts = dateStr.split(/[.\-\/]/).map(p => parseInt(p, 10));
      if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        let [year, month, day] = parts;
        if (year < 100) year += 2000;
        if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const d = new Date(Date.UTC(year, month - 1, day));
          return d;
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

function formatDateWithDay(date: Date | null): string {
  if (!date) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}(${days[date.getUTCDay()]})`;
}

function formatDateISO(date: Date | null): string {
  if (!date) return '';
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function matchRound(targetRound: string, roundField: string): boolean {
  if (!targetRound || !roundField) return false;

  const normalizedTargetRound = targetRound.trim()
    .replace(/\s/g, '')
    .replace(/[차치]/g, '');

  const normalizedField = String(roundField)
    .replace(/\s/g, '')
    .replace(/[차치]/g, '')
    .replace(/[/|]/g, ',');

  const roundList = normalizedField.split(',').filter(r => r.trim() !== '');

  return roundList.some(r => {
    const normalizedRoundItem = r.trim();
    return normalizedRoundItem !== '' && normalizedRoundItem === normalizedTargetRound;
  });
}

interface MemoInfo {
  memo: string;
  manager: string;
}

function buildMemoMap(memoRows: string[][]): Record<string, MemoInfo> {
  const map: Record<string, MemoInfo> = {};
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

function parseSchedules(inputRows: string[][], memoMap: Record<string, MemoInfo>) {
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
    const targetRounds = normalizedRound.split(',').filter((r: string) => r.trim() !== '');

    // 각 차수마다 schedule 등록
    for (const targetRound of targetRounds) {
      if (!scheduleMap.has(targetRound)) {
        // GP 오픈 일정 추출
        const lines = content.split('\n');
        const gpLine = lines.find((line: string) => line.includes('GP 오픈 예정'));
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
        const deadlineContent = inputRows.find((r: string[]) => {
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
      if (matchRound(targetRound as string, round)) {
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
      }
    }
  }

  return Array.from(scheduleMap.values());
}

function parseCalendarEvents(inputRows: string[][]) {
  if (!inputRows || inputRows.length === 0) return [];

  const events = [];
  let eventId = 1;

  for (const row of inputRows) {
    const rawDate = row?.[0];
    const date = parseSheetDate(rawDate);
    if (!date) continue;

    const category = String(row?.[1] || '').trim();
    const company = String(row?.[2] || '').trim();
    const round = String(row?.[3] || '').trim();
    const content = String(row?.[4] || '').trim();

    if (!content) continue;

    // 타이틀 생성
    const titleParts = [];
    if (round) titleParts.push(`▶${round}`);
    if (category) titleParts.push(`[${category}]`);
    if (company) titleParts.push(company);
    if (content) titleParts.push(content);

    const title = titleParts.join(' ');

    // 타입 결정
    let type: 'goodrich' | 'company' | 'session' = 'company';
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
      description: content,
    });
  }

  return events;
}

interface Recipient {
  company: string;
  address: string;
}

function parseAdminSettings(rows: string[][]) {
  const defaults = {
    checklist: [
      { id: '1', text: '위촉서류 제출' },
      { id: '2', text: '굿리치 앱 설치 및 프로필 설정' },
    ],
    guidance: '환영합니다! 굿리치 전문가로의 첫 걸음을 응원합니다.',
    recipients: [] as Recipient[],
  };

  if (!rows) return defaults;

  const settings = {
    checklist: [] as { id: string; text: string }[],
    guidance: '',
    recipients: [] as Recipient[],
  };

  let isInRecipientSection = false;

  rows.forEach((row) => {
    const key = (row?.[0] || '').toString().trim().replace(/`/g, '');
    const value = (row?.[1] || '').toString().trim();

    if (!key) return;

    // A열에 "수신"이 나오면 수신처 섹션 시작
    if (key === '수신') {
      isInRecipientSection = true;
      return;
    }

    // 수신처 섹션 내에서 데이터 수집
    if (isInRecipientSection) {
      // A열에 다른 키워드가 나오면 수신처 섹션 종료
      if (key === '위촉필요서류' || key === '체크리스트') {
        isInRecipientSection = false;
      } else {
        // A열: 회사명, B열: 주소
        if (value) {
          settings.recipients.push({
            company: key,
            address: value
          });
        }
        return;
      }
    }

    if (!value) return;

    switch (key) {
      case '위촉필요서류':
        settings.guidance = value;
        break;
      case '체크리스트':
        settings.checklist.push({
          id: `${settings.checklist.length + 1}`,
          text: value
        });
        break;
    }
  });

  return {
    checklist: settings.checklist.length > 0 ? settings.checklist : defaults.checklist,
    guidance: settings.guidance || defaults.guidance,
    recipients: settings.recipients,
  };
}

export interface SheetData {
  requiredDocuments: string;
  checklist: { id: string; text: string }[];
  recipients: { company: string; address: string }[];
  schedules: any[];
  calendarEvents: any[];
}

/**
 * 클라이언트에서 Google Sheets를 직접 가져와서 파싱하는 함수
 * GitHub Pages 같은 정적 호스팅에서도 작동합니다.
 */
export async function fetchSheetsDataClient(): Promise<SheetData> {
  try {
    console.log('🔄 Google Sheets에서 데이터 가져오는 중...');

    // Fetch all sheets
    const [inputCSV, memoCSV, adminCSV] = await Promise.all([
      fetchSheetAsCSV(SPREADSHEET_ID, SHEET_NAMES.INPUT),
      fetchSheetAsCSV(SPREADSHEET_ID, SHEET_NAMES.MEMO),
      fetchSheetAsCSV(SPREADSHEET_ID, SHEET_NAMES.ADMIN),
    ]);

    const inputRows = parseCSV(inputCSV).slice(1); // 헤더 제거
    const memoRows = parseCSV(memoCSV).slice(1);
    const adminRows = parseCSV(adminCSV).slice(1);

    // 데이터 파싱
    const adminSettings = parseAdminSettings(adminRows);
    const memoMap = buildMemoMap(memoRows);
    const schedules = parseSchedules(inputRows, memoMap);
    const calendarEvents = parseCalendarEvents(inputRows);

    const data: SheetData = {
      requiredDocuments: adminSettings.guidance,
      checklist: adminSettings.checklist,
      recipients: adminSettings.recipients,
      schedules: schedules,
      calendarEvents: calendarEvents,
    };

    console.log(`✅ 데이터 가져오기 완료: ${schedules.length}개 차수, ${calendarEvents.length}개 이벤트`);

    return data;

  } catch (error) {
    console.error('❌ Google Sheets 데이터 가져오기 실패:', error);
    throw error;
  }
}

