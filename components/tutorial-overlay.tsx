'use client'

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: '[data-tutorial="calendar-button"]',
    title: '전체위촉일정보기',
    description: '전체위촉 일정을 달력에서 확인!',
    position: 'bottom',
  },
  {
    target: '[data-tutorial="required-documents"]',
    title: '위촉필요서류',
    description: '위촉지원시스템에 업로드해야 하는 서류 안내',
    position: 'bottom',
  },
  {
    target: '[data-tutorial="checklist"]',
    title: '위촉 체크리스트',
    description: '3가지는 꼭 완료해야 위촉이 진행됩니다.',
    position: 'bottom',
  },
  {
    target: '[data-tutorial="date-selector"]',
    title: '업로드완료일선택',
    description: '위촉서류를 위촉지원시스템에 모두 업로드한 날짜, 매주 수요일 마감 중 선택 가능',
    position: 'top',
  },
  {
    target: '[data-tutorial="search-button"]',
    title: '조회하기',
    description: '본인 차수의 위촉일정 조회 가능',
    position: 'top',
  },
];

interface TutorialOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function TutorialOverlay({ open, onClose }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!open) return;

    const updateTargetPosition = () => {
      const step = TUTORIAL_STEPS[currentStep];
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [open, currentStep]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!open || !targetRect) return null;

  const step = TUTORIAL_STEPS[currentStep];

  // 설명 박스 위치 계산
  let tooltipStyle: React.CSSProperties = {};
  const padding = 20;

  switch (step.position) {
    case 'top':
      tooltipStyle = {
        left: `${targetRect.left + targetRect.width / 2}px`,
        top: `${targetRect.top - padding}px`,
        transform: 'translate(-50%, -100%)',
      };
      break;
    case 'bottom':
      tooltipStyle = {
        left: `${targetRect.left + targetRect.width / 2}px`,
        top: `${targetRect.bottom + padding}px`,
        transform: 'translate(-50%, 0)',
      };
      break;
    case 'left':
      tooltipStyle = {
        left: `${targetRect.left - padding}px`,
        top: `${targetRect.top + targetRect.height / 2}px`,
        transform: 'translate(-100%, -50%)',
      };
      break;
    case 'right':
      tooltipStyle = {
        left: `${targetRect.right + padding}px`,
        top: `${targetRect.top + targetRect.height / 2}px`,
        transform: 'translate(0, -50%)',
      };
      break;
  }

  return (
    <>
      {/* 오버레이 배경 */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={onClose} />

      {/* 강조 영역 (하얀 테두리) */}
      <div
        className="fixed border-4 border-white rounded-lg z-[9999] pointer-events-none"
        style={{
          left: `${targetRect.left - 4}px`,
          top: `${targetRect.top - 4}px`,
          width: `${targetRect.width + 8}px`,
          height: `${targetRect.height + 8}px`,
        }}
      />

      {/* 설명 박스 */}
      <div
        className="fixed z-[10000] bg-white rounded-lg shadow-2xl p-6 max-w-sm"
        style={tooltipStyle}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        {/* 단계 표시 */}
        <div className="text-sm text-gray-500 mb-2">
          {currentStep + 1} / {TUTORIAL_STEPS.length}
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>

        {/* 설명 */}
        <p className="text-gray-700 mb-4">{step.description}</p>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500"
          >
            건너뛰기
          </Button>

          <Button
            onClick={handleNext}
            size="sm"
            className="gap-1 bg-blue-500 hover:bg-blue-600"
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? '완료' : '다음'}
            {currentStep < TUTORIAL_STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
}
