'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecruitmentSchedule, SheetData } from "@/lib/types";

interface ResultPageProps {
  selectedDate: string;
}

export default function ResultPage({ selectedDate }: ResultPageProps) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<RecruitmentSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';
    fetch(`${basePath}/data.json`)
      .then(res => res.json())
      .then((data: SheetData) => {
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
      })
      .catch(err => {
        console.error('데이터 로드 실패:', err);
        setLoading(false);
      });
  }, [selectedDate]);

  const handlePdfDownload = async () => {
    if (!schedule) return;

    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    const element = document.getElementById('result-content');
    const container = element?.parentElement;
    if (!element || !container) return;

    // PDF 저장을 위해 임시로 PC 버전 고정 너비 설정
    const originalMaxWidth = container.style.maxWidth;
    const originalWidth = (container as HTMLElement).style.width;
    container.style.maxWidth = '1200px';
    (container as HTMLElement).style.width = '1200px';

    // 약간의 지연을 두고 렌더링 완료 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      width: 1200,
    });

    // 원래 상태로 복원
    container.style.maxWidth = originalMaxWidth;
    (container as HTMLElement).style.width = originalWidth;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`위촉일정_${schedule.round}.pdf`);
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
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">
            위촉일정:{schedule.round}차({schedule.gpOpenDate})
          </h1>

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
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            이전으로
          </Button>
          <Button
            className="gap-2 bg-blue-500 hover:bg-blue-600"
            onClick={handlePdfDownload}
          >
            <Download className="h-4 w-4" />
            위촉차수PDF저장
          </Button>
        </div>
      </div>
    </div>
  );
}
