'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QuestionFlow from "@/components/application-flow/question-flow";
import PersonalInfoForm from "@/components/application-flow/personal-info-form";
import ApplicationPreview from "@/components/application-flow/application-preview";

type FlowStep = 'questions' | 'sample-preview' | 'personal-info' | 'preview' | 'completed';

interface PersonalInfo {
  company: string;
  companyAddress: string;
  residentNumber: string;
  name: string;
  address: string;
  phone: string;
  submissionDate: string;
  recipients: string[]; // 다중 수신처
}

export default function ApplicationFlowPage() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('questions');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [submissionDate, setSubmissionDate] = useState<Date | null>(null);

  const handleQuestionsComplete = (results: string[]) => {
    setSelectedResults(results);
    setCurrentStep('sample-preview');
  };

  const handleViewSample = () => {
    setCurrentStep('sample-preview');
  };

  const handleStartWriting = () => {
    setCurrentStep('personal-info');
  };

  const handlePersonalInfoComplete = (info: PersonalInfo) => {
    setPersonalInfo(info);
    setCurrentStep('preview');
  };

  const handlePdfDownloaded = () => {
    setCurrentStep('completed');
  };

  const handleGoBack = () => {
    if (currentStep === 'sample-preview') {
      setCurrentStep('questions');
    } else if (currentStep === 'personal-info') {
      setCurrentStep('sample-preview');
    } else if (currentStep === 'preview') {
      setCurrentStep('personal-info');
    }
  };

  const handleReset = () => {
    setCurrentStep('questions');
    setSelectedResults([]);
    setPersonalInfo(null);
    setSubmissionDate(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-[10%]">
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            협회 말소처리 안내
          </h1>
          <p className="text-gray-600">
            본인의 상황을 알려주세요
          </p>
        </div>

        {currentStep === 'questions' && (
          <QuestionFlow onComplete={handleQuestionsComplete} />
        )}

        {currentStep === 'sample-preview' && (
          <div className="space-y-4">
            <ApplicationPreview
              personalInfo={{
                company: 'A금융서비스',
                companyAddress: '서울시 강남구 강남길 21',
                residentNumber: '800101-1234567',
                name: '홍길동',
                address: '서울시 강남구 강남길 12',
                phone: '010-1234-5678',
                submissionDate: '2025-01-01',
                recipients: [
                  '생명보험협회 - 서울특별시 중구 퇴계로 173, 16층(충무로3가)',
                  '손해보험협회 - 서울특별시 종로구 종로1길 50 15층 B동(케이트윈타워) 손해보험협회 자격관리팀',
                  'A금융서비스 - 서울시 강남구 강남길 21'
                ]
              }}
              selectedResults={selectedResults}
              onPdfDownloaded={() => {}}
              onBack={handleGoBack}
              isSample={true}
            />

            {/* 샘플 하단 버튼 */}
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
                onClick={handleStartWriting}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-900">
                      내용증명 작성을 도와드릴까요?
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 'personal-info' && (
          <PersonalInfoForm
            onComplete={handlePersonalInfoComplete}
            onBack={handleGoBack}
            selectedResults={selectedResults}
          />
        )}

        {currentStep === 'preview' && personalInfo && (
          <ApplicationPreview
            personalInfo={personalInfo}
            selectedResults={selectedResults}
            onPdfDownloaded={handlePdfDownloaded}
            onBack={handleGoBack}
          />
        )}

        {currentStep === 'completed' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              다운로드가 완료됐습니다.
            </h2>
            <Button
              onClick={handleReset}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              처음으로
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
