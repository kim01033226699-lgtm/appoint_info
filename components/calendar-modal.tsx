'use client'

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from "date-fns";
import { ko } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: CalendarEvent[];
}

// 이벤트 배경색 결정 함수
const getEventColor = (event: CalendarEvent): string => {
  // 협회: 회색
  if (event.type === 'session') {
    return 'bg-gray-500';
  }
  // 굿리치: 주황색
  if (event.type === 'goodrich') {
    return 'bg-orange-500';
  }
  // 위촉: 파란색
  if (event.title.includes('[위촉]')) {
    return 'bg-blue-600';
  }
  // 해촉: 연한 파란색
  if (event.title.includes('[해촉]')) {
    return 'bg-blue-300';
  }
  // 기본값
  return 'bg-cyan-500';
};

// 이벤트 텍스트 색상 결정 함수 (연한 배경의 경우 어두운 텍스트 사용)
const getEventTextColor = (event: CalendarEvent): string => {
  // 해촉: 연한 파란색 배경이므로 어두운 텍스트 사용
  if (event.title.includes('[해촉]')) {
    return 'text-blue-900';
  }
  // 나머지는 흰색 텍스트
  return 'text-white';
};

// 이벤트 정렬 우선순위 함수
const getEventPriority = (event: CalendarEvent): number => {
  // 1. 협회
  if (event.type === 'session') {
    return 1;
  }
  // 2. 굿리치
  if (event.type === 'goodrich') {
    return 2;
  }
  // 3. 위촉
  if (event.title.includes('[위촉]')) {
    return 3;
  }
  // 4. 해촉
  if (event.title.includes('[해촉]')) {
    return 4;
  }
  // 5. 나머지
  return 5;
};

// 이벤트 배열 정렬 함수
const sortEventsByPriority = (events: CalendarEvent[]): CalendarEvent[] => {
  return events.slice().sort((a, b) => {
    return getEventPriority(a) - getEventPriority(b);
  });
};

export default function CalendarModal({ open, onOpenChange, events }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 현재 달의 날짜들 가져오기
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // 날짜별 이벤트 그룹화
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = event.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  // 날짜별로 정렬된 이벤트 (Agenda용)
  const sortedEvents = useMemo(() => {
    return events
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  // 날짜별로 그룹화된 이벤트 (Agenda용)
  const eventsByDateForAgenda = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    sortedEvents.forEach((event) => {
      const key = event.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    // 각 날짜별로 이벤트를 우선순위에 따라 정렬
    const entries = Array.from(map.entries()).map(([date, events]) => {
      return [date, sortEventsByPriority(events)] as [string, CalendarEvent[]];
    });
    return entries;
  }, [sortedEvents]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const events = eventsByDate.get(dateStr) || [];
    return sortEventsByPriority(events);
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full md:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>전체 일정 캘린더</DialogTitle>
          <DialogDescription>
            날짜를 클릭하여 상세 일정을 확인하세요.
          </DialogDescription>
        </DialogHeader>

        {/* PC 버전: 캘린더 뷰 */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'yyyy년 M월', { locale: ko })}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="text-center font-medium text-gray-600 text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors",
                    isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-100",
                    selectedDate && isSameDay(day, selectedDate) && "ring-2 ring-blue-500"
                  )}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsDetailOpen(true);
                  }}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    !isCurrentMonth && "text-gray-400"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "text-xs px-1 py-0.5 rounded truncate",
                          getEventColor(event),
                          getEventTextColor(event)
                        )}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-600">
                        외 {dayEvents.length - 3}개
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* 모바일 버전: Agenda 뷰 */}
        <div className="md:hidden">
          <h2 className="text-lg font-semibold mb-4">전체 일정 목록</h2>
          <p className="text-sm text-gray-600 mb-4">모든 일정을 날짜순으로 확인합니다.</p>

          <div className="space-y-4">
            {eventsByDateForAgenda.map(([date, dateEvents], idx) => (
              <div key={idx} className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">
                  {format(new Date(date), 'M월 d일 (E)', { locale: ko })}
                </h3>
                <div className="space-y-2">
                  {dateEvents.map((event, eventIdx) => (
                    <div
                      key={eventIdx}
                      className={cn(
                        "p-3 rounded-lg",
                        getEventColor(event),
                        getEventTextColor(event)
                      )}
                    >
                      <div className="font-medium text-sm">{event.title}</div>
                      {event.description && (
                        <div className="text-xs mt-1 opacity-90">{event.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>

      {/* 날짜별 상세 일정 팝업 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })}
            </DialogTitle>
            <DialogDescription>
              선택한 날짜의 상세 일정입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {selectedDate && getEventsForDate(selectedDate).map((event, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-lg",
                  getEventColor(event),
                  getEventTextColor(event)
                )}
              >
                <div className="font-medium">{event.title}</div>
                {event.description && (
                  <div className="text-sm mt-1 opacity-90">{event.description}</div>
                )}
              </div>
            ))}
            {selectedDate && getEventsForDate(selectedDate).length === 0 && (
              <div className="text-gray-500 text-sm text-center py-8">
                일정이 없습니다.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
