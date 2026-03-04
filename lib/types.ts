export interface ChecklistItem {
  id: string;
  text: string;
}

export interface RecruitmentSchedule {
  round: string;
  deadline: string;
  gpOpenDate: string;
  gpOpenTime: string;
  companies: CompanySchedule[];
}

export interface CompanySchedule {
  company: string;
  round: string;
  acceptanceDeadline: string;
  gpUploadDate: string;
  recruitmentMethod: string;
  manager: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "goodrich" | "company" | "session";
  description?: string;
}

export interface SheetData {
  requiredDocuments: string;
  checklist: ChecklistItem[];
  schedules: RecruitmentSchedule[];
  calendarEvents: CalendarEvent[];
}

