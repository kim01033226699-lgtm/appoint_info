'use client'

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, ArrowRight, Edit2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { format, addDays, parseISO, isBefore, isAfter } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import NavigationHeader from "@/components/navigation-header";

type Step = 1 | 2 | 3 | 4;

interface OnboardingData {
  department: string;
  name: string;
  desiredDate?: Date;
  isAssociationCancelled: boolean | null;
  certProofSentDate?: Date;
  certifications: {
    life: boolean;
    damage: boolean;
    third: boolean;
    variable: boolean;
  };
  educationStatus: 'none' | 'new' | 'experienced' | null;
  insuranceChecked: boolean | null;
}

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: string;
  category: string;
  company: string;
  round: string;
  content: string;
  associationRegistrationDate: string | null;
}

interface ScheduleData {
  calendarEvents: CalendarEvent[];
}

interface ScheduleResult {
  round: string;
  gpOpenDate: string;
  deadlineDate: string;
  associationDeadline: string;
  educationDeadline: string;
  isPossible: boolean;
  messages: string[];
}

// Step 1 컴포넌트 - 별도로 추출하여 메모이제이션
interface Step1ContentProps {
  department: string;
  name: string;
  onDepartmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
}

const Step1Content = React.memo(({ department, name, onDepartmentChange, onNameChange, onNext }: Step1ContentProps) => {
  console.log('Step1Content rendering - memoized component');

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">안녕하세요. 굿리치 위촉 도우미입니다. 👋</CardTitle>
        <CardDescription className="text-base">
          위촉하려는 소속과 이름을 알려주세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="department">소속</Label>
          <input
            id="department"
            type="text"
            placeholder="굿리치본부"
            value={department}
            onChange={onDepartmentChange}
            autoComplete="off"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {department && department.length < 2 && (
            <p className="text-sm text-red-500">소속은 2자 이상 입력해주세요.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <input
            id="name"
            type="text"
            placeholder="홍길동"
            value={name}
            onChange={onNameChange}
            autoComplete="off"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {name && name.length < 2 && (
            <p className="text-sm text-red-500">이름은 2자 이상 입력해주세요.</p>
          )}
        </div>
        <Button
          className="w-full bg-goodrich-yellow-light hover:opacity-90"
          disabled={!department || department.length < 2 || !name || name.length < 2}
          onClick={onNext}
        >
          다음
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
});

Step1Content.displayName = 'Step1Content';

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>({
    department: '',
    name: '',
    isAssociationCancelled: null,
    certifications: {
      life: false,
      damage: false,
      third: false,
      variable: false,
    },
    educationStatus: null,
    insuranceChecked: null,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCertProofDateOpen, setIsCertProofDateOpen] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);

  // Step 2 내 질문 진행 상태
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const [hasCertProof, setHasCertProof] = useState<boolean | null>(null);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';
        const response = await fetch(`${basePath}/data.json`);
        if (!response.ok) throw new Error('데이터 로딩 실패');
        const jsonData = await response.json();
        setScheduleData(jsonData as ScheduleData);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }
    };
    loadData();
  }, []);

  // Step 1: 소속/이름 입력 핸들러
  const handleDepartmentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Department input:', value);
    setData(prev => ({ ...prev, department: value }));
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Name input:', value);
    setData(prev => ({ ...prev, name: value }));
  }, []);

  // Step 2: 위촉 정보 선택 (순차적 질문)
  const Step2Content = () => {
    const handleNext = () => {
      setCurrentQuestion(currentQuestion + 1);
    };

    const handlePrev = () => {
      if (currentQuestion > 1) {
        setCurrentQuestion(currentQuestion - 1);
      } else {
        setStep(1);
        setCurrentQuestion(1);
      }
    };

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{data.name}님, 반갑습니다. 💐</CardTitle>
          <CardDescription className="text-base">
            신속한 영업 준비를 위해 아래 내용을 확인해 주시면 위촉 일정을 바로 안내 해 드리겠습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 질문 1: 희망일 선택 */}
          {currentQuestion === 1 && (
            <>
              <div className="space-y-2">
                <Label className="text-lg">굿리치 코드 발급 희망일은 언제인가요?</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !data.desiredDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data.desiredDate ? (
                        format(data.desiredDate, "PPP", { locale: ko })
                      ) : (
                        <span>날짜를 선택해주세요</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.desiredDate}
                      onSelect={(date) => {
                        setData({ ...data, desiredDate: date });
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
                <Button
                  className="flex-1 bg-goodrich-yellow-light hover:opacity-90"
                  disabled={!data.desiredDate}
                  onClick={handleNext}
                >
                  다음
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* 질문 2: 협회말소 여부 */}
          {currentQuestion === 2 && (
            <>
              <div className="space-y-3">
                <Label className="text-lg">협회말소를 이미 하셨나요?</Label>
                <div className="flex gap-4">
                  <Button
                    variant={data.isAssociationCancelled === true ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      data.isAssociationCancelled === true && "bg-goodrich-yellow-light hover:opacity-90"
                    )}
                    onClick={() => {
                      setData({ ...data, isAssociationCancelled: true, certProofSentDate: undefined });
                      setHasCertProof(null);
                      handleNext();
                    }}
                  >
                    예
                  </Button>
                  <Button
                    variant={data.isAssociationCancelled === false ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      data.isAssociationCancelled === false && "bg-goodrich-yellow-light hover:opacity-90"
                    )}
                    onClick={() => {
                      setData({ ...data, isAssociationCancelled: false });
                      setCurrentQuestion(2.5); // 내용증명 질문으로
                    }}
                  >
                    아니오
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handlePrev}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
              </div>
            </>
          )}

          {/* 질문 2.5: 내용증명 발송 여부 (협회말소 안한 경우) */}
          {currentQuestion === 2.5 && (
            <>
              <div className="space-y-3">
                <Label className="text-lg">내용증명을 발송하셨나요?</Label>
                <div className="flex gap-4">
                  <Button
                    variant={hasCertProof === true ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      hasCertProof === true && "bg-goodrich-yellow-light hover:opacity-90"
                    )}
                    onClick={() => {
                      setHasCertProof(true);
                      setCurrentQuestion(2.7); // 발송일 선택으로
                    }}
                  >
                    예
                  </Button>
                  <Button
                    variant={hasCertProof === false ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      hasCertProof === false && "bg-goodrich-yellow-light hover:opacity-90"
                    )}
                    onClick={() => {
                      setHasCertProof(false);
                      setData({ ...data, certProofSentDate: undefined });
                      handleNext();
                    }}
                  >
                    아니오
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setCurrentQuestion(2);
                    setData({ ...data, isAssociationCancelled: null });
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
              </div>
            </>
          )}

          {/* 질문 2.7: 내용증명 발송일 선택 */}
          {currentQuestion === 2.7 && (
            <>
              <div className="space-y-2">
                <Label className="text-lg">내용증명 발송일을 선택해주세요</Label>
                <Popover open={isCertProofDateOpen} onOpenChange={setIsCertProofDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !data.certProofSentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data.certProofSentDate ? (
                        format(data.certProofSentDate, "PPP", { locale: ko })
                      ) : (
                        <span>날짜를 선택해주세요</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.certProofSentDate}
                      onSelect={(date) => {
                        setData({ ...data, certProofSentDate: date });
                        setIsCertProofDateOpen(false);
                      }}
                      initialFocus
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentQuestion(2.5)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
                <Button
                  className="flex-1 bg-goodrich-yellow-light hover:opacity-90"
                  disabled={!data.certProofSentDate}
                  onClick={handleNext}
                >
                  다음
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* 질문 3: 자격 선택 */}
          {currentQuestion === 3 && (
            <>
              <div className="space-y-3">
                <Label className="text-lg">보유하신 판매 자격을 선택해주세요</Label>
                <div className="space-y-2">
                  {[
                    { key: 'life', label: '생명보험' },
                    { key: 'damage', label: '손해보험' },
                    { key: 'third', label: '제3보험' },
                    { key: 'variable', label: '변액보험' },
                  ].map((cert) => (
                    <div key={cert.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={cert.key}
                        checked={data.certifications[cert.key as keyof typeof data.certifications]}
                        onCheckedChange={(checked) =>
                          setData({
                            ...data,
                            certifications: {
                              ...data.certifications,
                              [cert.key]: checked as boolean,
                            },
                          })
                        }
                      />
                      <label
                        htmlFor={cert.key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {cert.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handlePrev}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
                <Button
                  className="flex-1 bg-goodrich-yellow-light hover:opacity-90"
                  disabled={!Object.values(data.certifications).some(v => v)}
                  onClick={handleNext}
                >
                  다음
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* 질문 4: 등록교육 여부 */}
          {currentQuestion === 4 && (
            <>
              <div className="space-y-3">
                <Label className="text-lg">신규/경력 등록교육을 받으셨나요?</Label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'none', label: '아직 안 함' },
                    { value: 'new', label: '신규등록 이수' },
                    { value: 'experienced', label: '경력등록 이수' },
                  ].map((edu) => (
                    <Button
                      key={edu.value}
                      variant={data.educationStatus === edu.value ? "default" : "outline"}
                      className={cn(
                        "w-full",
                        data.educationStatus === edu.value && "bg-goodrich-yellow-light hover:opacity-90"
                      )}
                      onClick={() => {
                        setData({ ...data, educationStatus: edu.value as OnboardingData['educationStatus'] });
                        handleNext();
                      }}
                    >
                      {edu.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handlePrev}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
              </div>
            </>
          )}

          {/* 질문 5: 보증보험 조회 */}
          {currentQuestion === 5 && (
            <>
              <div className="space-y-3">
                <Label className="text-lg">보증보험 조회를 완료하셨나요?</Label>
                <div className="flex gap-4">
                  <Button
                    variant={data.insuranceChecked === true ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      data.insuranceChecked === true && "bg-goodrich-yellow-light hover:opacity-90"
                    )}
                    onClick={() => {
                      setData({ ...data, insuranceChecked: true });
                      setStep(3);
                      setCurrentQuestion(1);
                    }}
                  >
                    예
                  </Button>
                  <Button
                    variant={data.insuranceChecked === false ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      data.insuranceChecked === false && "bg-goodrich-yellow-light hover:opacity-90"
                    )}
                    onClick={() => {
                      setData({ ...data, insuranceChecked: false });
                      setStep(3);
                      setCurrentQuestion(1);
                    }}
                  >
                    아니오
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handlePrev}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Step 3: 선택사항 확인
  const Step3Content = () => {
    const selectedCerts = Object.entries(data.certifications)
      .filter(([_, checked]) => checked)
      .map(([key]) => {
        const labels: Record<string, string> = {
          life: '생명보험',
          damage: '손해보험',
          third: '제3보험',
          variable: '변액보험',
        };
        return labels[key];
      });

    const educationLabel = {
      none: '아직 안 함',
      new: '신규등록 이수',
      experienced: '경력등록 이수',
    }[data.educationStatus || 'none'];

    const handleConfirm = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = generateScheduleResult();
      setScheduleResult(result);
      setIsLoading(false);
      setStep(4);
    };

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{data.name}님</CardTitle>
          <CardDescription className="text-base">
            {data.desiredDate && format(data.desiredDate, "yyyy년 MM월 dd일 (E)", { locale: ko })}에 위촉 희망하셨습니다.<br />
            입력하신 내용을 확인해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">소속/이름</div>
                <div className="font-medium">{data.department} / {data.name}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">희망 위촉일</div>
                <div className="font-medium">
                  {data.desiredDate && format(data.desiredDate, "yyyy년 MM월 dd일 (E)", { locale: ko })}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">협회말소 여부</div>
                <div className="font-medium">
                  {data.isAssociationCancelled ? '완료/발송함' : '미완료'}
                  {data.isAssociationCancelled === false && data.certProofSentDate &&
                    ` (내용증명: ${format(data.certProofSentDate, "yyyy.MM.dd", { locale: ko })})`
                  }
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">보유 자격</div>
                <div className="font-medium">{selectedCerts.join(', ')}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">등록교육 상태</div>
                <div className="font-medium">{educationLabel}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">보증보험 조회</div>
                <div className="font-medium">{data.insuranceChecked ? '완료' : '미완료'}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setStep(2);
                setCurrentQuestion(5);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              이전
            </Button>
            <Button
              className="flex-1 bg-goodrich-yellow-light hover:opacity-90"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? '조회 중...' : '확인하기'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 일정 결과 생성 로직
  const generateScheduleResult = (): ScheduleResult => {
    if (!data.desiredDate || !scheduleData) {
      return {
        round: '',
        gpOpenDate: '',
        deadlineDate: '',
        associationDeadline: '',
        educationDeadline: '',
        isPossible: false,
        messages: ['데이터를 불러올 수 없습니다.']
      };
    }

    const messages: string[] = [];
    const desiredDateStr = format(data.desiredDate, "yyyy년 MM월 dd일 (E)", { locale: ko });

    // 1. GP오픈 이벤트 찾기 (기획서: B열=굿리치, E열=GP오픈)
    const gpOpenEvents = scheduleData.calendarEvents.filter(event =>
      event.type === 'goodrich' &&
      (event.content.includes('위촉') || event.content.includes('당사계정오픈')) &&
      !isBefore(parseISO(event.date), data.desiredDate!)
    ).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    let targetGpEvent = null;
    let isPossible = true;

    // 2. 협회말소 여부에 따라 차수 찾기
    if (data.isAssociationCancelled === true) {
      // 협회말소 완료: 희망일 기준 가장 근접한 차수
      targetGpEvent = gpOpenEvents[0];
    } else if (data.certProofSentDate) {
      // 내용증명 발송: 발송일 기준 11일 이후 도래하는 차수
      const earliestDate = addDays(data.certProofSentDate, 11);
      targetGpEvent = gpOpenEvents.find(event =>
        !isBefore(parseISO(event.date), earliestDate)
      );

      // 내용증명 발송 후 11일이 지나지 않아 위촉 불가
      if (!targetGpEvent || isBefore(parseISO(targetGpEvent.date), earliestDate)) {
        return {
          round: '',
          gpOpenDate: desiredDateStr,
          deadlineDate: '',
          associationDeadline: '',
          educationDeadline: '',
          isPossible: false,
          messages: [
            `${data.name}님, 굿리치 위촉을 ${desiredDateStr}로 원하시는군요.`,
            '아쉽지만 이 일정에 굿리치 코드 발급을 현재 스케쥴로는 불가능합니다.',
            '',
            `내용증명 발송일(${format(data.certProofSentDate, "yyyy년 MM월 dd일", { locale: ko })}) 기준으로`,
            '최소한 11일 이후에 위촉이 가능합니다.',
            '',
            '다른 위촉일정을 확인해 볼까요?'
          ]
        };
      }
    }

    if (!targetGpEvent) {
      return {
        round: '',
        gpOpenDate: desiredDateStr,
        deadlineDate: '',
        associationDeadline: '',
        educationDeadline: '',
        isPossible: false,
        messages: [
          `${data.name}님, 굿리치 위촉을 ${desiredDateStr}로 원하시는군요.`,
          '아쉽지만 현재 스케쥴에서 해당 일정을 찾을 수 없습니다.',
          '',
          '협회말소와 등록교육 방법을 안내해 드릴까요?',
          '다른 위촉일정을 확인해 볼까요?'
        ]
      };
    }

    // 3. 차수 정보 추출 (기획서: D열의 차수)
    const gpDate = parseISO(targetGpEvent.date);
    const round = targetGpEvent.round || format(gpDate, 'M-w');

    // 4. 전산승인마감일 찾기 (기획서: 같은 차수의 전산승인마감)
    const deadlineEvents = scheduleData.calendarEvents.filter(event =>
      event.type === 'goodrich' &&
      event.content.includes('전산승인마감') &&
      event.round === round &&
      isBefore(parseISO(event.date), gpDate)
    ).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    const deadlineEvent = deadlineEvents[0];
    const deadlineDate = deadlineEvent ? parseISO(deadlineEvent.date) : addDays(gpDate, -3);

    // 5. 협회등록일 찾기 (기획서: 차수별 협회등록일)
    const assocRegEvents = scheduleData.calendarEvents.filter(event =>
      event.associationRegistrationDate !== null &&
      event.round === round
    );

    let associationRegistrationDate: Date | null = null;
    if (assocRegEvents.length > 0 && assocRegEvents[0].associationRegistrationDate) {
      associationRegistrationDate = parseISO(assocRegEvents[0].associationRegistrationDate);
    }

    // 6. 협회말소 기한일과 등록교육 수료일 역산
    let associationDeadline: Date;
    let educationDeadline: Date;

    if (associationRegistrationDate) {
      // 협회등록일이 있으면 그 기준으로 역산
      associationDeadline = addDays(associationRegistrationDate, -11); // 11일 전까지 협회말소
      educationDeadline = addDays(associationRegistrationDate, -7); // 7일 전까지 등록교육
    } else {
      // 협회등록일이 없으면 전산승인마감일 기준으로 역산
      associationDeadline = addDays(deadlineDate, -11);
      educationDeadline = addDays(deadlineDate, -7);
    }

    // 7. 위촉 가능 여부 판단
    const today = new Date();
    const canMeetAssociationDeadline: boolean = data.isAssociationCancelled === true ||
                                       (data.isAssociationCancelled === false &&
                                        data.certProofSentDate !== undefined &&
                                        !isAfter(today, associationDeadline));
    const canMeetEducationDeadline: boolean = data.educationStatus !== 'none' ||
                                     !isAfter(today, educationDeadline);

    isPossible = canMeetAssociationDeadline && canMeetEducationDeadline;

    // 8. 안내 메시지 생성 (케이스별로 맞춤)
    messages.push(`${data.name}님, 굿리치 위촉을 ${desiredDateStr} 원하시는군요.`);

    if (!isPossible) {
      messages.push('현재 상태로는 희망하시는 날짜에 위촉이 어려울 수 있습니다.');
    } else {
      messages.push('위촉 절차를 안내 드릴게요.');
    }
    messages.push('');
    messages.push(`📅 예정 위촉 차수: ${round}`);
    messages.push('');

    // Case 1: 협회말소 미완료
    if (!data.isAssociationCancelled) {
      const deadlinePassed = isAfter(today, associationDeadline);
      messages.push(`1. 협회 말소${deadlinePassed ? ' (⚠️ 기한 경과)' : ''}`);
      messages.push(`   ${format(associationDeadline, "yyyy년 MM월 dd일", { locale: ko })}까지 협회 말소를 완료해주세요.`);

      if (data.certProofSentDate) {
        const certDeadline = addDays(associationDeadline, -2);
        messages.push(`   내용증명으로 말소하시려면 ${format(certDeadline, "MM월 dd일", { locale: ko })}까지 발송하셔야 합니다.`);
      }
      messages.push('');
      messages.push('   💡 협회말소 절차:');
      messages.push('   - 기존 소속사에 말소 요청');
      messages.push('   - 또는 내용증명 우편으로 직접 협회에 말소 신청');
    } else {
      messages.push('1. 협회말소 ✓');
      messages.push('   협회말소를 완료하셨거나 내용증명을 발송하셨습니다.');
    }

    // Case 2: 자격 관련
    const selectedCerts = Object.entries(data.certifications)
      .filter(([_, checked]) => checked)
      .map(([key]) => {
        const labels: Record<string, string> = {
          life: '생명보험',
          damage: '손해보험',
          third: '제3보험',
          variable: '변액보험',
        };
        return labels[key];
      });

    const allCerts = ['생명보험', '손해보험', '제3보험', '변액보험'];
    const missingCerts = allCerts.filter(cert => !selectedCerts.includes(cert));

    messages.push('');
    messages.push(`2. 판매 자격`);
    messages.push(`   보유 자격: ${selectedCerts.join(', ')}`);

    if (missingCerts.length > 0) {
      messages.push('');
      messages.push(`   추가 필요 자격: ${missingCerts.join(', ')}`);
      messages.push('   → 시험 응시가 필요합니다. 관리자에게 문의해주세요.');
    }

    // Case 3: 등록교육
    messages.push('');
    const educationDeadlinePassed = isAfter(today, educationDeadline);

    if (data.educationStatus === 'none') {
      messages.push(`3. 등록교육${educationDeadlinePassed ? ' (⚠️ 기한 경과)' : ''}`);
      messages.push(`   ${format(educationDeadline, "yyyy년 MM월 dd일", { locale: ko })}까지 등록교육을 이수해주세요.`);
      messages.push('');
      messages.push('   💡 등록교육 안내:');
      messages.push('   - 보유 자격에 따라 신규/경력 등록교육 이수');
      messages.push('   - 수료 후 수료증을 위촉지원사이트에 업로드');
    } else {
      const eduType = data.educationStatus === 'new' ? '신규등록교육' : '경력등록교육';
      messages.push(`3. 등록교육 ✓`);
      messages.push(`   ${eduType}을 이수하셨습니다.`);
    }

    // Case 4: 위촉사이트 서류 제출
    messages.push('');
    messages.push(`4. 위촉지원사이트 서류 제출`);
    messages.push(`   ${format(deadlineDate, "yyyy년 MM월 dd일 (E)", { locale: ko })}까지 완료`);
    messages.push('   - 정보 입력 및 서류 업로드');
    messages.push('   - 원본 서류 발송');
    messages.push('   - 사원등록 신청 완료');

    // Case 5: 보증보험
    messages.push('');
    if (!data.insuranceChecked) {
      messages.push('5. 보증보험 조회');
      messages.push('   보증보험 조회를 완료해주세요.');
    } else {
      messages.push('5. 보증보험 조회 ✓');
      messages.push('   보증보험 조회를 완료하셨습니다.');
    }

    messages.push('');
    messages.push('─'.repeat(40));
    messages.push('');

    if (!isPossible) {
      messages.push('⚠️ 위 일정을 맞추기 어려운 경우, 다음 차수로 위촉을 진행하시는 것을 권장드립니다.');
    } else {
      messages.push('✅ 위 일정에 맞춰 진행하시면 원하시는 날짜에 위촉이 가능합니다!');
    }

    messages.push('');
    messages.push('📞 자세한 안내가 필요하시면 담당자에게 문의해주세요.');

    return {
      round,
      gpOpenDate: format(gpDate, "yyyy년 MM월 dd일 (E)", { locale: ko }),
      deadlineDate: format(deadlineDate, "yyyy-MM-dd"),
      associationDeadline: format(associationDeadline, "yyyy-MM-dd"),
      educationDeadline: format(educationDeadline, "yyyy-MM-dd"),
      isPossible,
      messages
    };
  };

  // Step 4: 조회 결과
  const Step4Content = () => {
    if (!scheduleResult) return null;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {scheduleResult.isPossible ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600" />
            )}
            <CardTitle className="text-2xl">{data.name}님 위촉 일정 안내</CardTitle>
          </div>
          {scheduleResult.gpOpenDate && (
            <CardDescription className="text-base">
              예정 위촉일: {scheduleResult.gpOpenDate}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {!scheduleResult.isPossible && scheduleResult.messages.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-900">
                ⚠️ 현재 상태로는 희망하시는 날짜에 위촉이 어려울 수 있습니다.
                아래 안내사항을 확인해주세요.
              </p>
            </div>
          )}

          <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {scheduleResult.messages.map((message, index) => (
              <p key={index} className="text-sm leading-relaxed whitespace-pre-line">
                {message}
              </p>
            ))}
          </div>

          {/* 링크 버튼 */}
          <div className="space-y-3 mb-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.open('https://docusign.goodrich.kr/main', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              위촉지원사이트 바로가기
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setStep(1);
                setScheduleResult(null);
                setData({
                  department: '',
                  name: '',
                  isAssociationCancelled: null,
                  certifications: {
                    life: false,
                    damage: false,
                    third: false,
                    variable: false,
                  },
                  educationStatus: null,
                  insuranceChecked: null,
                });
              }}
            >
              처음으로
            </Button>
            <Button
              className="flex-1 bg-goodrich-yellow-light hover:opacity-90"
              onClick={() => {
                setStep(2);
                setScheduleResult(null);
              }}
            >
              다시 입력하기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <NavigationHeader />

      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 진행 표시 */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      step >= s
                        ? "bg-goodrich-yellow-light text-gray-900"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div
                      className={cn(
                        "w-12 h-1 mx-1",
                        step > s ? "bg-goodrich-yellow-light" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 단계별 컨텐츠 */}
          {step === 1 && <Step1Content
            department={data.department}
            name={data.name}
            onDepartmentChange={handleDepartmentChange}
            onNameChange={handleNameChange}
            onNext={() => setStep(2)}
          />}
          {step === 2 && <Step2Content />}
          {step === 3 && <Step3Content />}
          {step === 4 && <Step4Content />}
        </div>
      </div>
    </div>
  );
}
