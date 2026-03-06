'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecruitmentSchedule, SheetData } from "@/lib/types";
import { fetchSheetsDataClient } from "@/lib/fetch-sheets-client";
import { BASE_PATH } from "@/lib/utils";
import { isGPApp, downloadFile } from '@/lib/gp-bridge';

interface ResultPageProps {
  selectedDate: string;
}

export default function ResultPage({ selectedDate }: ResultPageProps) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<RecruitmentSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Google Sheets에서 실시간 데이터 로딩 중...');
        // 클라이언트에서 직접 Google Sheets 가져오기 (GitHub Pages 호환)
        const data = await fetchSheetsDataClient();
        if (!data.schedules || data.schedules.length === 0) {
          setLoading(false);
          return;
        }

        const selectedDateObj = new Date(selectedDate);
        const normalizedSelectedDate = new Date(Date.UTC(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate()));

        // 선택한 날짜 이후의 자격추가/전산승인마감 이벤트 찾기
        const candidates = data.calendarEvents.filter(event => {
          const eventDate = new Date(event.date);
          const normalizedEventDate = new Date(Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()));

          const isCandidateContent = event.title.includes('자격추가/전산승인마감') ||
            event.title.includes('자격추가') ||
            event.title.includes('전산승인마감');

          return normalizedEventDate.getTime() >= normalizedSelectedDate.getTime() &&
            event.type === 'goodrich' &&
            isCandidateContent &&
            event.title.match(/(\d+)월(\d+)차/);
        });

        if (candidates.length === 0) {
          console.warn(`선택한 날짜 ${selectedDate} 이후의 일정을 찾을 수 없습니다.`);
          setSchedule(data.schedules[0] || null);
          setLoading(false);
          return;
        }

        // 날짜순 정렬 후 가장 빠른 것 선택
        candidates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const closestEvent = candidates[0];

        let foundSchedule = data.schedules[0]; // 기본값

        // title에서 차수 추출: "▶9월4차[위촉]: ..." 형식
        const roundMatch = closestEvent.title.match(/(\d+)월(\d+)차/);

        if (roundMatch) {
          const month = roundMatch[1];
          const round = roundMatch[2];
          // "9월4차" → "9-4" 형식으로 변환 (schedules의 round와 매칭)
          const targetRound = `${month}-${round}`;

          console.log(`선택한 날짜: ${selectedDate}, 찾은 이벤트: ${closestEvent.date}, 차수: ${targetRound}`);

          const matchedSchedule = data.schedules.find(s => s.round === targetRound || s.round === `${targetRound}차`);
          if (matchedSchedule) {
            foundSchedule = matchedSchedule;
          } else {
            console.warn(`차수 ${targetRound}에 해당하는 스케줄을 찾을 수 없습니다.`);
          }
        }

        setSchedule(foundSchedule);
        setLoading(false);
      } catch (err) {
        console.error('데이터 로드 실패:', err);
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  const handlePdfDownload = async () => {
    // 위촉일정이 없을 때 처리
    if (!schedule || !schedule.companies || schedule.companies.length === 0) {
      alert('위촉일정이 없습니다.');
      return;
    }

    try {
      console.log('PDF 다운로드 시작...');

      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      console.log('라이브러리 로드 완료');

      const element = document.getElementById('result-content');
      console.log('Element 찾기:', element ? '성공' : '실패');

      if (!element) {
        alert('PDF 생성할 요소를 찾을 수 없습니다.');
        return;
      }

      // 현재 스타일 저장
      const originalStyle = {
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
        width: element.style.width,
        transform: element.style.transform,
      };

      // PDF 생성을 위한 임시 스타일 적용
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.width = '1200px';
      element.style.transform = 'none';

      console.log('스타일 적용 완료, 렌더링 대기...');
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('Canvas 생성 시작...');
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true,
        width: 1200,
      });
      console.log('Canvas 생성 완료:', canvas.width, 'x', canvas.height);

      // 스타일 복원
      element.style.position = originalStyle.position;
      element.style.left = originalStyle.left;
      element.style.top = originalStyle.top;
      element.style.width = originalStyle.width;
      element.style.transform = originalStyle.transform;

      console.log('이미지 데이터 변환 중...');
      const imgData = canvas.toDataURL('image/png');
      console.log('이미지 데이터 길이:', imgData.length);

      console.log('PDF 생성 중...');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      console.log('PDF 크기:', imgWidth, 'x', imgHeight);

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const fileName = `위촉일정_${schedule.round}.pdf`;
      console.log('PDF 저장:', fileName);

      // GP 앱과 일반 브라우저 분기 처리
      if (isGPApp()) {
        console.log('GP 앱 감지 - R2 업로드 방식 사용');
        try {
          const pdfBlob = pdf.output('blob');

          // R2에 업로드
          const formData = new FormData();
          formData.append('pdf', pdfBlob, fileName);
          formData.append('fileName', fileName);

          const response = await fetch('/api/pdf/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const { downloadUrl } = await response.json();
          console.log('R2 업로드 완료:', downloadUrl);

          // GP 앱의 downloadFile로 다운로드
          downloadFile(downloadUrl, fileName);
          console.log('✅ GP 앱 다운로드 완료!');
        } catch (uploadError) {
          console.error('R2 업로드 실패:', uploadError);
          alert('파일 업로드에 실패했습니다. 다시 시도해주세요.');
          return;
        }
      } else {
        // 일반 브라우저: 직접 다운로드
        pdf.save(fileName);
        console.log('✅ PDF 다운로드 완료!');
        alert('PDF가 다운로드되었습니다.');
      }
    } catch (error) {
      console.error('❌ PDF 생성 실패:', error);
      alert(`PDF 생성 중 오류가 발생했습니다.\n${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-gray-600">데이터 로딩 중...</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-red-600">일정을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div id="result-content">
          {/* 헤더 */}
          <div className="flex flex-col items-center mb-2">
            <div className="mb-2">
              <img src={`${BASE_PATH}/images/GR-img.png`} alt="GoodRich" className="h-[20px] w-auto" />
            </div>
            <h1 className="text-xl font-extrabold text-center">
              위촉일정:{schedule.round}차({schedule.gpOpenDate})
            </h1>
          </div>

          {/* 굿리치/손보코드 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                굿리치/손보코드
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">일정: </span>
                <span>{schedule.gpOpenDate} GP 오픈 예정 ({schedule.gpOpenTime})</span>
              </div>
              <div className="text-orange-600 text-sm">
                *손해보험 코드는 GP-인사정보에서 확인 가능
              </div>
            </CardContent>
          </Card>

          {/* 생명보험사 위촉 일정 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                생명보험사 위촉 일정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-orange-600 space-y-1 mb-4">
                <div>* 동양생명/라이나생명/저브라이프생명은 위촉 시 제출한 보험사 서류로 진행합니다.(별도 위촉 문자/알림톡 없음)</div>
                <div>* 차수별 일정표의 보험사 위촉 마감일 이후 D+1~2일 이내에 위촉안내가 문자·알림톡으로 발송됩니다.(회사별 방법 참고)</div>
                <div>* 문자·알림톡을 확인하시고 회사별로 위촉 진행을 반드시 해 주셔야 보험사 코드 발급이 진행됩니다.</div>
              </div>

              {/* 테이블 */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 w-[15%] min-w-[80px]">회사</th>
                      <th className="border border-gray-300 p-2 w-[10%] min-w-[60px]">차수</th>
                      <th className="border border-gray-300 p-2 w-[15%] min-w-[90px]">접수마감일</th>
                      <th className="border border-gray-300 p-2 w-[15%] min-w-[90px]">GP업로드</th>
                      <th className="border border-gray-300 p-2 w-[18%] min-w-[120px]">위촉방법</th>
                      <th className="border border-gray-300 p-2 w-[27%] min-w-[180px]">담당자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.companies.map((company, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">{company.company}</td>
                        <td className="border border-gray-300 p-2">{company.round}차</td>
                        <td className="border border-gray-300 p-2">{company.acceptanceDeadline}</td>
                        <td className="border border-gray-300 p-2">{company.gpUploadDate}</td>
                        <td className="border border-gray-300 p-2">{company.recruitmentMethod}</td>
                        <td className="border border-gray-300 p-2">{company.manager}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-gray-600 mt-4 text-center md:text-right">
                * 좌우로 스크롤
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 버튼들 */}
        <div className="flex flex-row gap-4 justify-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push('/info-appoint')}
          >
            <ArrowLeft className="h-4 w-4" />
            이전으로
          </Button>
          <Button
            className="gap-2 bg-blue-500 hover:bg-blue-600"
            onClick={handlePdfDownload}
          >
            <Download className="h-4 w-4" />
            PDF저장
          </Button>
        </div>
      </div>
    </div>
  );
}
