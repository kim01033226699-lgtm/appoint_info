'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { format, isWednesday } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { SheetData } from "@/lib/types";
import CalendarModal from "@/components/calendar-modal";
import TutorialOverlay from "@/components/tutorial-overlay";
// import sheetDataJson from "@/public/data.json";

export default function MainPage() {
  const router = useRouter();
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAllCalendarOpen, setIsAllCalendarOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    console.log('MainPage useEffect 실행');

    // fetch를 사용하여 데이터 로드
    const loadData = async () => {
      try {
        console.log('데이터 fetch 시작');
        const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';
        const response = await fetch(`${basePath}/data.json`);
        console.log('fetch 응답:', response);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        console.log('데이터 로딩 성공:', jsonData);
        setData(jsonData as SheetData);
        setLoading(false);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
        setLoading(false);
      }
    };

    loadData();

    // 최초 방문 체크
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      // 데이터 로딩 후 튜토리얼 표시
      setTimeout(() => {
        setShowTutorial(true);
      }, 500);
    }
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const allChecked = data ? checkedItems.size === data.checklist.length : false;

  const handleCheckChange = (id: string, checked: boolean) => {
    const newChecked = new Set(checkedItems);
    if (checked) {
      newChecked.add(id);
    } else {
      newChecked.delete(id);
    }
    setCheckedItems(newChecked);
  };

  const handleSearch = () => {
    if (selectedDate) {
      setIsSearching(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setTimeout(() => {
        router.push(`/result?date=${dateStr}`);
      }, 1300);
    }
  };

  // 수요일만 선택 가능하도록
  const disableNonWednesdays = (date: Date) => {
    return !isWednesday(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-gray-600">데이터 로딩 중...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">데이터 로딩 실패</h2>
          <p className="text-gray-600 mb-4">데이터를 불러올 수 없습니다.</p>
          <p className="text-sm text-gray-500 mb-4">브라우저 개발자 도구 콘솔을 확인해주세요.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-2">위촉일정 조회 중</div>
          <div className="text-gray-600">잠시만 기다려 주세요...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            굿리치 위촉일정
          </h1>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsAllCalendarOpen(true)}
            data-tutorial="calendar-button"
          >
            <CalendarIcon className="h-4 w-4" />
            전체위촉일정보기
          </Button>
        </div>

        {/* 위촉필요서류 */}
        <Card className="mb-6" data-tutorial="required-documents">
          <CardHeader>
            <CardTitle>위촉필요서류</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              {data.requiredDocuments}
            </CardDescription>
          </CardContent>
        </Card>

        {/* 위촉 체크리스트 */}
        <Card className="mb-6" data-tutorial="checklist">
          <CardHeader>
            <CardTitle>위촉 체크리스트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.checklist.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <Checkbox
                  id={item.id}
                  checked={checkedItems.has(item.id)}
                  onCheckedChange={(checked) =>
                    handleCheckChange(item.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={item.id}
                  className="text-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {item.text}
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 위촉예정일 조회 */}
        <Card>
          <CardHeader>
            <CardTitle>위촉예정일 조회</CardTitle>
            <CardDescription>
              위촉지원시스템 업로드 완료는 매주 수요일 마감입니다. 업로드 완료일을 선택해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                    disabled={!allChecked}
                    data-tutorial="date-selector"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: ko })
                    ) : (
                      <span>업로드완료일선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={disableNonWednesdays}
                    initialFocus
                    locale={ko}
                    modifiers={{
                      wednesday: (date) => isWednesday(date),
                    }}
                    modifiersClassNames={{
                      wednesday: "text-red-600 font-bold",
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Button
                className="gap-2 bg-blue-500 hover:bg-blue-600"
                disabled={!allChecked || !selectedDate}
                onClick={handleSearch}
                data-tutorial="search-button"
              >
                <Search className="h-4 w-4" />
                조회
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 전체 캘린더 모달 */}
      <CalendarModal
        open={isAllCalendarOpen}
        onOpenChange={setIsAllCalendarOpen}
        events={data.calendarEvents}
      />

      {/* 튜토리얼 오버레이 */}
      <TutorialOverlay
        open={showTutorial}
        onClose={handleCloseTutorial}
      />
    </div>
  );
}
