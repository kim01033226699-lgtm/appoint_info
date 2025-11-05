'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ArrowLeft, AlertCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SubmissionDateSelectorProps {
  onDateSelected: (date: Date) => void;
  onBack: () => void;
}

export default function SubmissionDateSelector({
  onDateSelected,
  onBack
}: SubmissionDateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 선택일 이후 11일자 계산
  const calculateDates = (startDate: Date) => {
    const dates = [];
    for (let i = 1; i <= 11; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  };

  const handleConfirm = () => {
    if (selectedDate) {
      setShowResults(true);
    }
  };

  const handleFinalConfirm = () => {
    if (selectedDate) {
      onDateSelected(selectedDate);
    }
  };

  const calculatedDates = selectedDate ? calculateDates(selectedDate) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>등기 발송 일자 선택</CardTitle>
          <CardDescription>
            등기를 발송한 날짜를 선택해 주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 날짜 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제출 예정일
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: ko })
                    ) : (
                      <span>날짜를 선택해주세요</span>
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
                      setShowResults(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 버튼 */}
            {!showResults && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  이전으로
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedDate}
                >
                  확인
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 결과 표시 */}
      {showResults && selectedDate && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              중요 일정 안내
            </CardTitle>
            <CardDescription>
              제출일({format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })}) 이후 11일간의 일정입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 날짜 목록 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">
                  확인해야 할 날짜들:
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {calculatedDates.map((date, index) => (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border border-blue-200 text-sm"
                    >
                      <span className="font-medium text-blue-600">
                        {index + 1}일차:
                      </span>{" "}
                      {format(date, "MM월 dd일 (E)", { locale: ko })}
                    </div>
                  ))}
                </div>
              </div>
              {/* 최종 확인 버튼 */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowResults(false)}
                  className="flex-1"
                >
                  날짜 다시 선택
                </Button>
                <Button
                  onClick={handleFinalConfirm}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  확인 완료
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
