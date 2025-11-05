'use client'

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, AlertCircle } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { addDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';

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

interface ApplicationPreviewProps {
  personalInfo: PersonalInfo;
  selectedResults: string[];
  onPdfDownloaded: () => void;
  onBack: () => void;
  isSample?: boolean;
}

export default function ApplicationPreview({
  personalInfo,
  selectedResults,
  onPdfDownloaded,
  onBack,
  isSample = false
}: ApplicationPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // 등기발송일 기준 10일 경과일 계산
  const submissionDate = new Date(personalInfo.submissionDate);
  const tenDaysLater = addDays(submissionDate, 10);

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);

    try {
      // html2canvas를 사용하여 HTML을 캔버스로 변환
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // 캔버스를 이미지로 변환
      const imgData = canvas.toDataURL('image/png');

      // PDF 생성
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`해촉신청서_${personalInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`);

      setIsGenerating(false);
      onPdfDownloaded();
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        {!isSample && (
          <CardHeader>
            <CardDescription>
              아래 내용을 확인하신 후 PDF로 다운로드하세요.
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={isSample ? "pt-6" : ""}>
          {/* 일정 안내 - 샘플 모드에서는 숨김 */}
          {!isSample && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    직접말소 일정 안내
                  </p>
                  <p className="text-sm text-blue-800">
                    등기발송일 {format(submissionDate, 'M월 d일', { locale: ko })} 이후 10일 경과일은{' '}
                    <span className="font-semibold">{format(tenDaysLater, 'yyyy년 M월 d일', { locale: ko })}</span>입니다.{' '}
                    이후 협회 방문 또는 인터넷으로 말소신청 웹페이지에서 신청하셔야 합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 신청서 미리보기 영역 */}
          <div
            ref={previewRef}
            className="bg-white p-8 border border-gray-300 rounded-lg"
            style={{ minHeight: '297mm' }}
          >
            {/* 제목 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">[설계사]해촉 신청서</h1>
            </div>

            {/* 신청서 표 */}
            <table className="w-full border-collapse mb-6">
              <tbody>
                <tr>
                  <td className="border border-gray-800 bg-gray-100 px-4 py-3 font-semibold w-1/4 text-center">
                    소속회사
                  </td>
                  <td className="border border-gray-800 px-4 py-3 text-center">
                    {personalInfo.company}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 bg-gray-100 px-4 py-3 font-semibold text-center">
                    성명
                  </td>
                  <td className="border border-gray-800 px-4 py-3 text-center">
                    {personalInfo.name}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 bg-gray-100 px-4 py-3 font-semibold text-center">
                    주민번호
                  </td>
                  <td className="border border-gray-800 px-4 py-3 text-center">
                    {personalInfo.residentNumber}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 bg-gray-100 px-4 py-3 font-semibold text-center">
                    주소
                  </td>
                  <td className="border border-gray-800 px-4 py-3 text-center">
                    {personalInfo.address}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 bg-gray-100 px-4 py-3 font-semibold text-center">
                    전화번호
                  </td>
                  <td className="border border-gray-800 px-4 py-3 text-center">
                    {personalInfo.phone}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 신청 내용 */}
            <div className="mb-8 text-center py-8">
              <p className="text-lg leading-relaxed">
                본인의 사정으로 귀사에 해촉처리를 요청하오니<br />
                처리하여 주시기 바랍니다.
              </p>
            </div>

            {/* 날짜 및 서명 */}
            <div className="mb-8 text-right">
              <p className="text-lg mb-2">내용증명 발송일자</p>
              <p className="text-lg mb-4 font-semibold">
                {personalInfo.submissionDate.replace(/-/g, '년 ').replace(/(\d{4})년 (\d{2}) (\d{2})/, '$1년 $2월 $3일')}
              </p>
              <p className="text-lg mb-8">
                신청인: {personalInfo.name} (날인 또는 서명)
              </p>
            </div>

            {/* 수신처 */}
            {personalInfo.recipients && personalInfo.recipients.length > 0 && (
              <div className="text-left">
                <p className="text-lg font-semibold mb-2">수신처:</p>
                {personalInfo.recipients.map((recipient, index) => (
                  <p key={index} className="text-lg ml-4">
                    {index + 1}. {recipient}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 영역 - 샘플 모드에서는 숨김 */}
          {!isSample && (
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={isGenerating}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                이전으로
              </Button>
              <Button
                onClick={handleDownloadPdf}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'PDF 생성 중...' : 'PDF 다운로드'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
