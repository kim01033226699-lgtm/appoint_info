'use client'

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface TutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TutorialPath = 'none' | 'new' | 'experienced';

export default function TutorialModal({ open, onOpenChange }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<TutorialPath>('none');

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
      return '신규 등록교육 또는 경력자 등록교육을 선택하세요.';
    }
    if (step === 1) {
      return path === 'new'
        ? '신규 등록교육 대상자인지 확인 후 진행하세요.'
        : '경력자 등록교육 대상자인지 확인 후 진행하세요.';
    }
    if (step === 2) {
      return '원하시는 교육 과정을 선택하여 수강신청하세요.';
    }
    return '';
  };

  const handlePathSelect = (selectedPath: TutorialPath) => {
    setPath(selectedPath);
    setStep(1);
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

  const handleClose = () => {
    setStep(0);
    setPath('none');
    onOpenChange(false);
  };

  const maxStep = 2;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-full md:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl md:text-2xl">
            {getStepTitle()}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            {getStepDescription()}
          </p>
        </DialogHeader>

        {/* 이미지 영역 */}
        <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4 relative">
          <div className="relative w-full h-full min-h-[400px] md:min-h-[600px]">
            <Image
              src={getImagePath()}
              alt={getStepTitle()}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* 하단 컨트롤 */}
        <div className="flex-shrink-0 border-t pt-4">
          {/* 0단계: 신규/경력 선택 버튼 */}
          {step === 0 && (
            <div className="flex gap-4 justify-center mb-4">
              <Button
                onClick={() => handlePathSelect('new')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                신규 등록교육 보기
              </Button>
              <Button
                onClick={() => handlePathSelect('experienced')}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                경력자 등록교육 보기
              </Button>
            </div>
          )}

          {/* 진행 표시 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {step + 1} / {maxStep + 1}
              </span>
              {path !== 'none' && (
                <span className="text-sm font-medium text-goodrich-yellow">
                  {path === 'new' ? '(신규)' : '(경력)'}
                </span>
              )}
            </div>

            {/* 이전/다음 버튼 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={step === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </Button>

              {step < maxStep ? (
                <Button
                  onClick={handleNext}
                  disabled={step === 0 && path === 'none'}
                  className="gap-1 bg-goodrich-yellow hover:opacity-90"
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleClose}
                  className="bg-goodrich-yellow hover:opacity-90"
                >
                  완료
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
