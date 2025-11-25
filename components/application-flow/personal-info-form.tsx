'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PersonalInfo {
  company: string;
  companyAddress: string;
  residentNumber: string;
  name: string;
  address: string;
  phone: string;
  submissionDate: string;
  recipients: string[];
}

interface PersonalInfoFormProps {
  onComplete: (info: PersonalInfo) => void;
  onBack: () => void;
  selectedResults: string[];
}

interface Recipient {
  company: string;
  address: string;
}

export default function PersonalInfoForm({ onComplete, onBack, selectedResults }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState<PersonalInfo>({
    company: '',
    companyAddress: '',
    residentNumber: '',
    name: '',
    address: '',
    phone: '',
    submissionDate: '',
    recipients: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PersonalInfo, string>>>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    // 구글시트에서 가져온 수신처 데이터 로드
    const loadRecipients = async () => {
      try {
        console.log('🔄 Google Sheets에서 수신처 데이터 로딩 중...');
        // 클라이언트에서 직접 Google Sheets 가져오기 (GitHub Pages 호환)
        const { fetchSheetsDataClient } = await import('@/lib/fetch-sheets-client');
        const data = await fetchSheetsDataClient();
        setRecipients(data.recipients || []);
      } catch (error) {
        console.error('수신처 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipients();
  }, []);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PersonalInfo, string>> = {};

    // 소속회사는 선택사항이므로 필수 체크 제거

    if (!formData.residentNumber.trim()) {
      newErrors.residentNumber = '주민번호를 입력해주세요.';
    } else if (!/^\d{6}-\d{7}$/.test(formData.residentNumber)) {
      newErrors.residentNumber = '올바른 주민번호 형식이 아닙니다. (예: 123456-1234567)';
    }

    if (!formData.name.trim()) {
      newErrors.name = '성명을 입력해주세요.';
    }

    if (!formData.address.trim()) {
      newErrors.address = '주소를 입력해주세요.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다.';
    }

    if (!formData.submissionDate) {
      newErrors.submissionDate = '신청일자를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // 질문 결과에서 수신처 생성
      const finalRecipients: string[] = [];

      selectedResults.forEach(result => {
        if (result === '현재 재직회사') {
          // 선택한 소속회사 정보 사용
          if (formData.company) {
            // 사용자가 직접 입력한 회사 주소가 있으면 사용, 없으면 구글시트 데이터 사용
            let recipientString = formData.company;
            if (formData.companyAddress) {
              recipientString = `${formData.company} - ${formData.companyAddress}`;
            } else {
              const matchedRecipient = recipients.find(r => r.company === formData.company);
              if (matchedRecipient) {
                recipientString = `${matchedRecipient.company} - ${matchedRecipient.address}`;
              }
            }
            finalRecipients.push(recipientString);
          }
        } else {
          // 협회 등 다른 수신처
          const matchedRecipient = recipients.find(r =>
            r.company.includes(result) || result.includes(r.company)
          );
          if (matchedRecipient) {
            const recipientString = `${matchedRecipient.company} - ${matchedRecipient.address}`;
            finalRecipients.push(recipientString);
          } else {
            finalRecipients.push(result);
          }
        }
      });

      onComplete({ ...formData, recipients: finalRecipients });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>내용증명 작성하기</CardTitle>
        <CardDescription>
          아래 사항을 입력해 주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 수신처 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              내용증명 발송할 기관/회사
            </label>
            {loading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                로딩 중...
              </div>
            ) : (
              <div className="space-y-4">
                {/* 질문 결과에 따른 수신처 표시 */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">제출 필요 기관:</p>
                  <div className="space-y-2">
                    {selectedResults.map((result, index) => {
                      // "현재 재직회사"는 선택한 소속회사로 대체
                      if (result === '현재 재직회사') {
                        if (formData.company) {
                          // 사용자가 직접 입력한 회사 주소가 있으면 사용, 없으면 구글시트 데이터 사용
                          let recipientString = formData.company;
                          if (formData.companyAddress) {
                            recipientString = `${formData.company} - ${formData.companyAddress}`;
                          } else {
                            const matchedRecipient = recipients.find(r => r.company === formData.company);
                            if (matchedRecipient) {
                              recipientString = `${matchedRecipient.company} - ${matchedRecipient.address}`;
                            }
                          }
                          return (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                              <span className="text-gray-800">{recipientString}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            <span className="text-gray-800">전 소속회사 (아래에서 소속회사 정보를 입력하세요)</span>
                          </div>
                        );
                      }

                      // 협회는 구글시트 데이터와 매칭
                      const matchedRecipient = recipients.find(r =>
                        r.company.includes(result) || result.includes(r.company)
                      );
                      if (matchedRecipient) {
                        const recipientString = `${matchedRecipient.company} - ${matchedRecipient.address}`;
                        return (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            <span className="text-gray-800">{recipientString}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          <span className="text-gray-800">{result}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 소속회사 */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              전 소속회사 입력
            </label>
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.company ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="전 소속회사 입력(미입력시 공란으로 표기됩니다)"
            />
            {errors.company && (
              <p className="text-red-500 text-sm mt-1">{errors.company}</p>
            )}
          </div>

          {/* 회사 주소 */}
          <div>
            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">
              전 소속회사 주소 입력
            </label>
            <input
              id="companyAddress"
              type="text"
              value={formData.companyAddress}
              onChange={(e) => handleChange('companyAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="전 소속회사 주소 입력(미입력시 공란으로 표기됩니다)"
            />
          </div>

          {/* 성명 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              성명 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="홍길동"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* 주민번호 */}
          <div>
            <label htmlFor="residentNumber" className="block text-sm font-medium text-gray-700 mb-1">
              주민번호 <span className="text-red-500">*</span>
            </label>
            <input
              id="residentNumber"
              type="text"
              value={formData.residentNumber}
              onChange={(e) => {
                let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출

                // 자동으로 - 추가
                if (value.length > 6) {
                  value = value.slice(0, 6) + '-' + value.slice(6, 13);
                }

                handleChange('residentNumber', value);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.residentNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123456-1234567 (- 자동 입력)"
              maxLength={14}
            />
            {errors.residentNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.residentNumber}</p>
            )}
          </div>

          {/* 주소 */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              주소 <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="본인의 집 주소를 입력하세요"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="010-1234-5678"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* 내용증명 발송일자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              내용증명 발송일자 <span className="text-red-500">*</span>
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    errors.submissionDate && "border-red-500"
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
                    if (date) {
                      handleChange('submissionDate', format(date, 'yyyy-MM-dd'));
                    }
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
            {errors.submissionDate && (
              <p className="text-red-500 text-sm mt-1">{errors.submissionDate}</p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 transition-all duration-150 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              이전으로
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 transition-all duration-150 active:scale-95"
            >
              다음 단계로
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
