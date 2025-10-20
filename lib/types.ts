export interface ChecklistItem {
  id: string;
  text: string;
}

export interface RecruitmentSchedule {
  round: string; // 예: "10-1차"
  deadline: string; // 예: "8/14"
  gpOpenDate: string; // 예: "10/27(월)"
  gpOpenTime: string; // 예: "PM16:00"
  companies: CompanySchedule[];
}

export interface CompanySchedule {
  company: string; // 회사명
  round: string; // 차수
  acceptanceDeadline: string; // 접수마감일
  gpUploadDate: string; // GP업로드
  recruitmentMethod: string; // 위촉방법
  manager: string; // 담당자
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO 8601 format (YYYY-MM-DD)
  type: 'goodrich' | 'company' | 'session';
  description?: string;
}

export interface SheetData {
  requiredDocuments: string;
  checklist: ChecklistItem[];
  schedules: RecruitmentSchedule[];
  calendarEvents: CalendarEvent[];
}
