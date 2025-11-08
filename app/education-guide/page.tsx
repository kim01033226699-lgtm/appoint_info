'use client'

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type TutorialPath = 'none' | 'new' | 'experienced';

// 각 단계별 클릭 가능한 영역 정의 (이미지 크기 대비 퍼센트)
interface ClickableArea {
  x: number; // left %
  y: number; // top %
  width: number; // width %
  height: number; // height %
  action: 'new' | 'experienced' | 'next';
}

export default function EducationGuidePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<TutorialPath>('none');

  // 각 단계별 클릭 가능한 영역 정의
  const getClickableAreas = (): ClickableArea[] => {
    if (step === 0) {
      // 0번 이미지: 신규/경력 선택
      return [
        { x: 5, y: 70, width: 15, height: 8, action: 'experienced' }, // 왼쪽 하단: 경력자 등록교육
        { x: 20, y: 50, width: 15, height: 8, action: 'new' }, // 왼쪽 중단: 신규 등록교육
      ];
    }

    if (step === 1 || step === 2) {
      // 1단계, 2단계: 다음으로 진행
      return [
        { x: 35, y: 85, width: 30, height: 8, action: 'next' }, // 하단 확인 버튼
      ];
    }

    return [];
  };

  // 이미지 경로 매핑
  const getImagePath = () => {
    if (step === 0) {
      return '/appoint_info/tutorial/0-신규.경력등록교육.png';
    }

    if (path === 'new') {
      if (step === 1) return '/appoint_info/tutorial/1-1신규등록교육.png';
      if (step === 2) return '/appoint_info/tutorial/1-2신규등록교육-3.png';
    }

    if (path === 'experienced') {
      if (step === 1) return '/appoint_info/tutorial/2-1경력등록교육.png';
      if (step === 2) return '/appoint_info/tutorial/2-2경력등록교육.png';
    }

    return '/appoint_info/tutorial/0-신규.경력등록교육.png';
  };

  // 단계별 제목
  const getStepTitle = () => {
    if (step === 0) return '등록교육 선택';
    if (path === 'new') {
      if (step === 1) return '신규 등록교육 - 대상자 확인';
      if (step === 2) return '신규 등록교육 - 과정 선택';
    }
    if (path === 'experienced') {
      if (step === 1) return '경력자 등록교육 - 대상자 확인';
      if (step === 2) return '경력자 등록교육 - 과정 선택';
    }
    return '등록교육 가이드';
  };

  // 단계별 설명
  const getStepDescription = () => {
    if (step === 0) {
      return '이미지에 표시된 신규 등록교육 또는 경력자 등록교육 버튼을 클릭하세요.';
    }
    if (step === 1) {
      return path === 'new'
        ? '신규 등록교육 대상자인지 확인하고, 확인 버튼을 클릭하세요.'
        : '경력자 등록교육 대상자인지 확인하고, 확인 버튼을 클릭하세요.';
    }
    if (step === 2) {
      return '원하시는 교육 과정을 선택하여 수강신청 버튼을 클릭하세요.';
    }
    return '';
  };

  const handleAreaClick = (action: string) => {
    if (action === 'new') {
      setPath('new');
      setStep(1);
    } else if (action === 'experienced') {
      setPath('experienced');
      setStep(1);
    } else if (action === 'next') {
      if (step < 2) {
        setStep(step + 1);
      } else {
        // 마지막 단계면 홈으로
        router.push('/');
      }
    }
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      if (step === 1) {
        setPath('none');
      }
    }
  };

  const handleReset = () => {
    setStep(0);
    setPath('none');
  };

  const maxStep = 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 헤더 */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              등록교육 가이드
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">홈으로</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 단계 정보 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {getStepTitle()}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base text-gray-600">
                {step + 1} / {maxStep + 1}
              </span>
              {path !== 'none' && (
                <span className="text-sm md:text-base font-medium px-3 py-1 bg-goodrich-yellow text-white rounded-full">
                  {path === 'new' ? '신규' : '경력'}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            {getStepDescription()}
          </p>
        </div>

        {/* 이미지 영역 */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <div className="relative w-full" style={{ minHeight: '500px', height: '70vh' }}>
            <Image
              src={getImagePath()}
              alt={getStepTitle()}
              fill
              className="object-contain"
              priority
            />

            {/* 클릭 가능한 영역 오버레이 */}
            {getClickableAreas().map((area, idx) => (
              <div
                key={idx}
                className="absolute cursor-pointer group"
                style={{
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  width: `${area.width}%`,
                  height: `${area.height}%`,
                }}
                onClick={() => handleAreaClick(area.action)}
              >
                {/* 클릭 가능한 영역 표시 (호버 시) */}
                <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-30 transition-opacity rounded-lg border-4 border-blue-500" />

                {/* 클릭 안내 */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                    클릭하세요
                  </div>
                </div>

                {/* 애니메이션 손가락 포인터 */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="relative w-16 h-16">
                    {/* 손가락 이모지 */}
                    <div className="relative w-16 h-16 flex items-center justify-center animate-click-pointer">
                      <span className="text-5xl filter drop-shadow-2xl">👆</span>
                    </div>

                    {/* 클릭 효과 원 - 파동 효과 */}
                    <div className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-400 animate-click-ripple opacity-70" />
                    <div className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-300 animate-click-ripple opacity-50" style={{ animationDelay: '0.5s' }} />

                    {/* 내부 반짝임 */}
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 rounded-full animate-pulse shadow-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 컨트롤 영역 */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          {/* 안내 메시지 */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>팁:</strong> 이미지 위에 마우스를 올리면 클릭 가능한 영역이 표시됩니다.
            </p>
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={step === 0}
              className="gap-2"
              size="lg"
            >
              <ChevronLeft className="h-5 w-5" />
              이전
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              size="lg"
            >
              처음으로
            </Button>

            <Button
              onClick={() => router.push('/')}
              className="gap-2"
              size="lg"
              variant="outline"
            >
              <Home className="h-5 w-5" />
              홈으로
            </Button>
          </div>
        </div>

        {/* 진행 상황 표시 */}
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === step
                  ? 'w-8 bg-goodrich-yellow'
                  : idx < step
                  ? 'w-2 bg-goodrich-yellow opacity-50'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
