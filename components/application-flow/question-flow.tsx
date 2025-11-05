'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle2, Circle, AlertCircle, CalendarIcon, Info } from "lucide-react";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  yesNext?: string; // 다음 질문 ID 또는 결과 ID
  noNext?: string;
  yesResult?: string[]; // 결과 추가
  noResult?: string[];
}

interface QuestionFlowProps {
  onComplete: (results: string[]) => void;
}

// 질문 트리 정의 (새로운 플로우)
const questions: Record<string, Question> = {
  q1: {
    id: 'q1',
    text: '현재 소속회사에서 해촉증명서를 받으셨나요?',
    yesResult: ['dismissal_certificate'], // 특수 결과
    noNext: 'q2',
  },
  q2: {
    id: 'q2',
    text: '직접 말소를 위해 내용증명을 발송하셨나요?',
    yesResult: ['certified_mail'], // 특수 결과 (날짜 입력 필요)
    noNext: 'q3',
  },
  q3: {
    id: 'q3',
    text: '전속설계사인가요?',
    yesNext: 'q4',
    noNext: 'q5',
  },
  q4: {
    id: 'q4',
    text: '교차판매중인가요?',
    yesResult: ['생명보험협회', '손해보험협회', '현재 재직회사'],
    noResult: ['생명보험협회 or 손해보험협회', '현재 재직회사'],
  },
  q5: {
    id: 'q5',
    text: '대리점 설계사인가요?',
    yesNext: 'q6',
    noResult: ['현재 재직회사'],
  },
  q6: {
    id: 'q6',
    text: '현재 소속된 회사에 생명&손해 자격이 모두 등록돼 있나요?',
    yesResult: ['생명보험협회', '손해보험협회', '현재 재직회사'],
    noResult: ['생명보험협회 or 손해보험협회', '현재 재직회사'],
  },
};

export default function QuestionFlow({ onComplete }: QuestionFlowProps) {
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('q1');
  const [history, setHistory] = useState<Array<{ questionId: string; answer: 'yes' | 'no' }>>([]);
  const [results, setResults] = useState<string[] | null>(null);
  const [certifiedMailDate, setCertifiedMailDate] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const currentQuestion = questions[currentQuestionId];

  const handleAnswer = (answer: 'yes' | 'no') => {
    const newHistory = [...history, { questionId: currentQuestionId, answer }];
    setHistory(newHistory);

    const nextQuestionId = answer === 'yes' ? currentQuestion.yesNext : currentQuestion.noNext;
    const resultArray = answer === 'yes' ? currentQuestion.yesResult : currentQuestion.noResult;

    if (resultArray) {
      // 결과 도달
      setResults(resultArray);
    } else if (nextQuestionId) {
      // 다음 질문으로 이동
      setCurrentQuestionId(nextQuestionId);
    }
  };

  const handleGoBack = () => {
    if (results) {
      // 결과 화면에서 뒤로가기
      const lastHistory = history[history.length - 1];
      setResults(null);
      setCurrentQuestionId(lastHistory.questionId);
    } else if (history.length > 0) {
      // 이전 질문으로
      const newHistory = [...history];
      const lastEntry = newHistory.pop();
      setHistory(newHistory);

      if (lastEntry) {
        setCurrentQuestionId(lastEntry.questionId);
      }
    }
  };

  const handleContinue = () => {
    if (results) {
      onComplete(results);
    }
  };

  const handleReset = () => {
    setCurrentQuestionId('q1');
    setHistory([]);
    setResults(null);
    setCertifiedMailDate(undefined);
  };

  if (results) {
    // 해촉증명서 받은 경우
    if (results.includes('dismissal_certificate')) {
      return (
        <div className="space-y-4">
          <Card className="border-2 border-blue-500">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Info className="h-6 w-6 text-blue-600" />
                해촉증명서 말소 신청 안내
              </CardTitle>
              <CardDescription>
                해촉증명서를 받으신 경우 아래 방법으로 말소 신청하실 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* 인터넷 직접 말소 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    인터넷 직접 말소
                  </h3>
                  <ul className="space-y-2 text-sm text-green-900 ml-7">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span><strong>16:30 이전 신청:</strong> 당일 접수 / 당일 처리</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span><strong>16:30 이후 신청:</strong> 익일 접수 / 익일 처리</span>
                    </li>
                  </ul>
                </div>

                {/* 방문 접수 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    협회 방문 접수
                  </h3>
                  <ul className="space-y-2 text-sm text-amber-900 ml-7">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span><strong>15:00 이전 방문:</strong> 당일 처리</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span><strong>15:00 이후 방문:</strong> 익일 처리</span>
                    </li>
                  </ul>
                </div>

                {/* 바로가기 링크 */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      인터넷 말소신청 바로가기
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="https://fp.insure.or.kr/direct/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-colors"
                      >
                        🔗 생명보험협회 인터넷말소신청 바로가기
                      </a>
                      <a
                        href="https://isi.knia.or.kr/confirm/login.do"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-colors"
                      >
                        🔗 손해보험협회 인터넷말소신청 바로가기
                      </a>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      협회 방문 조회
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="https://fp.insure.or.kr/process/process01"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-900 font-medium transition-colors"
                      >
                        📍 생명보험협회 지부 조회
                      </a>
                      <a
                        href="https://isi.knia.or.kr/information/directions.do"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-900 font-medium transition-colors"
                      >
                        📍 손해보험협회 지부 조회
                      </a>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                >
                  처음으로
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // 내용증명 발송한 경우
    if (results.includes('certified_mail')) {
      return (
        <div className="space-y-4">
          <Card className="border-2 border-blue-500">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-blue-600" />
                내용증명 발송일 확인
              </CardTitle>
              <CardDescription>
                내용증명을 발송한 날짜를 선택해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용증명 발송일
                  </label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !certifiedMailDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {certifiedMailDate ? (
                          format(certifiedMailDate, "PPP", { locale: ko })
                        ) : (
                          <span>날짜를 선택해주세요</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={certifiedMailDate}
                        onSelect={(date) => {
                          setCertifiedMailDate(date);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {certifiedMailDate && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3">
                        말소 신청 가능일
                      </h3>
                      <p className="text-sm text-blue-800 mb-2">
                        내용증명 발송일{' '}
                        <strong>{format(certifiedMailDate, 'yyyy년 M월 d일', { locale: ko })}</strong>{' '}
                        이후 11일째 되는 날은
                      </p>
                      <p className="text-lg font-bold text-blue-900 mb-4">
                        {format(addDays(certifiedMailDate, 11), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                      </p>
                      <p className="text-sm text-blue-800">
                        이 날짜 이후에 인터넷으로 말소 신청하거나 협회에 방문하셔야 합니다.
                      </p>
                    </div>

                    {/* 바로가기 링크 */}
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          인터넷 말소신청 바로가기
                        </h3>
                        <div className="space-y-2">
                          <a
                            href="https://fp.insure.or.kr/direct/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-colors"
                          >
                            🔗 생명보험협회 인터넷말소신청 바로가기
                          </a>
                          <a
                            href="https://isi.knia.or.kr/confirm/login.do"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-colors"
                          >
                            🔗 손해보험협회 인터넷말소신청 바로가기
                          </a>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          협회 방문 조회
                        </h3>
                        <div className="space-y-2">
                          <a
                            href="https://fp.insure.or.kr/process/process01"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-900 font-medium transition-colors"
                          >
                            📍 생명보험협회 지부 조회
                          </a>
                          <a
                            href="https://isi.knia.or.kr/information/directions.do"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-900 font-medium transition-colors"
                          >
                            📍 손해보험협회 지부 조회
                          </a>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex-1"
                  >
                    이전으로
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1"
                  >
                    처음으로
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // 일반 결과 (내용증명 작성 필요)
    return (
      <div className="space-y-4">
        {/* 선택한 경로 히스토리 */}
        {history.length > 0 && (
          <div className="relative space-y-3">
            {/* 연결선 */}
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-blue-300"></div>

            {history.map((h, index) => (
              <div key={index} className="relative">
                {/* 점 */}
                <div className="absolute left-2.5 top-6 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>

                <Card className="bg-gray-50 border-gray-200 ml-8">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Q{index + 1}</p>
                        <p className="text-gray-700 font-medium">{questions[h.questionId].text}</p>
                      </div>
                      <div className="ml-4">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          h.answer === 'yes'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {h.answer === 'yes' ? '네' : '아니오'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* 안내 문구 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900">
            내용증명을 발송하여 직접말소를 하시려면 아래 기관/회사에 내용증명을 발송하셔야 합니다.
          </p>
        </div>

        {/* 결과 표시 */}
        <Card className="border-2 border-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle>제출처 안내</CardTitle>
            <CardDescription>
              
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{result}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 버튼 영역 */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-300 hover:border-gray-400"
            onClick={handleGoBack}
          >
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  이전으로
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-green-500 bg-green-50 hover:bg-green-100"
            onClick={handleContinue}
          >
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-900">
                  내용증명샘플보기
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 이전 선택 내용 표시 */}
      {history.length > 0 && (
        <div className="relative space-y-3">
          {/* 연결선 */}
          <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-blue-300"></div>

          {history.map((h, index) => (
            <div key={index} className="relative">
              {/* 점 */}
              <div className="absolute left-2.5 top-6 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>

              <Card className="bg-gray-50 border-gray-200 ml-8">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">Q{index + 1}</p>
                      <p className="text-gray-700 font-medium">{questions[h.questionId].text}</p>
                    </div>
                    <div className="ml-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        h.answer === 'yes'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {h.answer === 'yes' ? '네' : '아니오'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* 현재 질문 - 더 짙게 표시 */}
      <div className="relative">
        {history.length > 0 && (
          <>
            {/* 연결선 연장 */}
            <div className="absolute left-4 top-0 h-12 w-0.5 bg-blue-300"></div>
            {/* 점 */}
            <div className="absolute left-2.5 top-12 w-3 h-3 bg-blue-600 rounded-full border-2 border-white z-10"></div>
          </>
        )}

        <Card className={`border-2 border-blue-500 shadow-lg ${history.length > 0 ? 'ml-8' : ''}`}>
          <CardHeader className="bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-blue-600">
                Q{history.length + 1}
              </span>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              {currentQuestion.text}
            </CardTitle>
          </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleAnswer('yes')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-6 text-lg font-semibold"
            >
              네
            </Button>
            <Button
              onClick={() => handleAnswer('no')}
              variant="outline"
              className="flex-1 py-6 text-lg font-semibold border-2 hover:bg-gray-100"
            >
              아니오
            </Button>
          </div>

          {history.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="w-full mt-4"
            >
              이전 질문으로
            </Button>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
