'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface Question {
  id: string;
  text: string;
  yesNext?: string;
  noNext?: string;
  yesResult?: string;
  noResult?: string;
}

// 질문 트리 정의
const questions: Record<string, Question> = {
  q1: {
    id: 'q1',
    text: '보험영업이 처음인 신규입사자 이신가요?',
    yesNext: 'q2',
    noNext: 'q3',
  },
  q2: {
    id: 'q2',
    text: '보험자격 시험에 응시해 합격하셨나요?',
    yesResult: 'new_registration', // 합격시 바로 신규등록교육
    noResult: 'exam_required', // 시험 응시 안내
  },
  q3: {
    id: 'q3',
    text: '경력 입사자이신가요?',
    yesNext: 'q4',
    noResult: 'career_check_guide', // 경력 확인 안내
  },
  q4: {
    id: 'q4',
    text: '경력 조회를 하셨나요?\n(경력일수는 3년 이내 1년(365일) 이상이어야 합니다.)',
    yesResult: 'career_registration', // 경력등록교육
    noResult: 'career_check_required', // 경력조회 안내
  },
};

export default function EducationQuestionFlow() {
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('q1');
  const [history, setHistory] = useState<Array<{ questionId: string; answer: 'yes' | 'no' }>>([]);
  const [result, setResult] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionId];

  const handleAnswer = (answer: 'yes' | 'no') => {
    const newHistory = [...history, { questionId: currentQuestionId, answer }];
    setHistory(newHistory);

    const nextQuestionId = answer === 'yes' ? currentQuestion.yesNext : currentQuestion.noNext;
    const resultId = answer === 'yes' ? currentQuestion.yesResult : currentQuestion.noResult;

    if (resultId) {
      // 결과 도달
      setResult(resultId);
    } else if (nextQuestionId) {
      // 다음 질문으로 이동
      setCurrentQuestionId(nextQuestionId);
    }
  };

  const handleGoBack = () => {
    if (result) {
      // 결과 화면에서 뒤로가기
      const lastHistory = history[history.length - 1];
      setResult(null);
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

  const handleReset = () => {
    setCurrentQuestionId('q1');
    setHistory([]);
    setResult(null);
  };

  // 결과 화면
  if (result) {
    if (result === 'new_registration') {
      return (
        <div className="space-y-4">
          <Card className="border-2 border-blue-500">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                축하드립니다!
              </CardTitle>
              <CardDescription>
                이제 신규입사자를 위한 [신규등록교육]을 수료하셔야 합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* 교육 안내 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">📚 신규 등록교육이란?</h3>
                  <ul className="space-y-2 text-sm text-blue-900">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>최초로 모집 종사자가 되려는 자가 이수하여야 하는 교육이며 경력 요건을 충족하지 못하신 분이 이직, 퇴사 등의 사유로 재등록하고자 할 때에도 신규등록교육을 이수하셔야 합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>교육은 온라인으로 신청과 수강이 가능합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>교육 수료후에는 수료증을 제출해 주셔야 합니다.</span>
                    </li>
                  </ul>
                </div>

                {/* 교육신청 링크 */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      교육신청 바로가기
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="https://is.in.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 교육신청 바로가기</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex-1 transition-all duration-150 active:scale-95"
                  >
                    이전으로
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 transition-all duration-150 active:scale-95"
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

    // 시험 응시 안내
    if (result === 'exam_required') {
      return (
        <div className="space-y-4">
          <Card className="border-2 border-amber-500">
            <CardHeader className="bg-amber-50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-amber-600" />
                시험 응시 안내
              </CardTitle>
              <CardDescription>
                모집인 자격시험에 응시해 합격하셔야 합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* 시험 안내 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-3">📝 자격시험 안내</h3>
                  <ul className="space-y-2 text-sm text-amber-900">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>신규입사자 중 모집인 자격시험에 합격한 적이 없으신 분은 생·손보 시험에 응시해 합격하셔야 합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>시험은 생명보험&손해보험 시험으로 진행하며 본인이 원하는 시험에 응시할 수 있습니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>시험일정은 매월 실시하며, 시험일자 및 지역, 장소 등 세부사항은 협회장이 별도로 정해 공지하고 있습니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>합격은 100점 만점에 60점 이상</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>성년의 경우 응시에 제한이 없지만 미성년의 경우 기혼자이면 본인 의사로 가능하고 그 외에는 법정대리인의 동의가 필요합니다.</span>
                    </li>
                  </ul>
                </div>

                {/* 문의 안내 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">💬 문의</h3>
                  <p className="text-sm text-blue-900">시험 접수 및 자세한 안내는 관리자에게 문의해 주세요</p>
                </div>

                {/* 시험센터 링크 */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      시험센터 바로가기
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="https://fp.insure.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 생명보험자격시험센터</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                      <a
                        href="https://isi.knia.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 손해보험모집종사자관리센터</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex-1 transition-all duration-150 active:scale-95"
                  >
                    이전으로
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 transition-all duration-150 active:scale-95"
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

    // 경력 확인 안내 (q3 아니오)
    if (result === 'career_check_guide') {
      return (
        <div className="space-y-4">
          <Card className="border-2 border-indigo-500">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                경력 확인 안내
              </CardTitle>
              <CardDescription>
                경력일수를 확인하고 적합한 등록교육을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* 안내 */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-900 mb-3">📋 안내</h3>
                  <ul className="space-y-2 text-sm text-indigo-900">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>이전에 생손보 시험에 합격하고 등록하여 영업을 하신적이 있다면 최근 3년이내 경력일수를 확인하고 경력에 맞는 등록교육을 수료하셔야 합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>순수신인 또는 1년 미만의 경력자는 신규 입사자로 등록 교육을 이수하셔야 합니다.</span>
                    </li>
                  </ul>
                </div>

                {/* 교육 구분 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">📚 교육 구분</h3>
                  <ul className="space-y-2 text-sm text-blue-900">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span><strong>3년내 1년이상</strong> → 경력등록교육</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span><strong>3년내 1년미만</strong> → 신규등록교육</span>
                    </li>
                  </ul>
                </div>

                {/* 경력조회 안내 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-3">💡 안내</h3>
                  <p className="text-sm text-amber-900">자격조회는 협회에서 하실 수 있습니다</p>
                </div>

                {/* 경력 확인 링크 */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      경력 확인 바로 가기
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">클릭 시 각 협회로 이동합니다</p>
                    <div className="space-y-2">
                      <a
                        href="http://www.klia.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 생명보험협회</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                      <a
                        href="http://www.knia.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 손해보험협회</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 등록교육 이수 링크 */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      등록교육 이수 바로 가기
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="https://is.in.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 보험연수원 사이버교육</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex-1 transition-all duration-150 active:scale-95"
                  >
                    이전으로
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 transition-all duration-150 active:scale-95"
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

    // 경력조회 안내
    if (result === 'career_check_required') {
      return (
        <div className="space-y-4">
          <Card className="border-2 border-purple-500">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
                경력조회 안내
              </CardTitle>
              <CardDescription>
                경력조회 후 적합한 등록교육을 신청하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* 경력조회 안내 */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3">📋 경력조회 안내</h3>
                  <ul className="space-y-2 text-sm text-purple-900">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>타사 경력자로 위촉 시에는 경력에 맞는 등록교육을 이수하셔야 합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>경력은 최근 3년 내 1년 이상(365일)으로 이하의 경력 일수이면 신규등록교육을 수료하셔야 합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>경력일수가 364일이어도 불인정합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>경력일수는 협회에서 조회하실 수 있습니다.</span>
                    </li>
                  </ul>
                </div>

                {/* 교육 구분 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">📚 교육 구분</h3>
                  <ul className="space-y-2 text-sm text-blue-900">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span><strong>3년내 1년이상</strong> → 경력등록교육</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span><strong>3년내 1년미만</strong> → 신규등록교육</span>
                    </li>
                  </ul>
                </div>

                {/* 중요 안내 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-3">⚠️ 중요</h3>
                  <p className="text-sm text-amber-900">본인경력과 다른 등록교육 이수시 다시 교육을 이수하셔야 합니다. 꼭 미리 확인해서 등록교육 신청바랍니다.</p>
                </div>

                {/* 경력조회 링크 */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      경력 확인 바로 가기
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">클릭 시 각 협회로 이동합니다</p>
                    <div className="space-y-2">
                      <a
                        href="http://www.klia.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 생명보험협회</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                      <a
                        href="http://www.knia.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 손해보험협회</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 교육신청 링크 */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      교육신청 바로가기
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="https://is.in.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 교육신청 바로가기</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex-1 transition-all duration-150 active:scale-95"
                  >
                    이전으로
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 transition-all duration-150 active:scale-95"
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

    // 경력등록교육
    if (result === 'career_registration') {
      return (
        <div className="space-y-4">
          <Card className="border-2 border-green-500">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                경력등록교육 안내
              </CardTitle>
              <CardDescription>
                최근 3년 이내 1년 이상 경력자를 위한 교육입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* 경력 안내 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3">📚 경력등록교육 안내</h3>
                  <ul className="space-y-2 text-sm text-green-900">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>최근 3년 이내 경력 일수가 1년(365일) 이상인 경우에는 경력자로 등록교육을 이수하셔야 합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>경력일수는 365일이 넘어야 합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>정확한 경력일수는 협회에서 확인하실 수 있습니다.</span>
                    </li>
                  </ul>
                </div>

                {/* 경력 확인 링크 */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      경력 확인 바로 가기
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">클릭 시 각 협회로 이동합니다</p>
                    <div className="space-y-2">
                      <a
                        href="http://www.klia.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 생명보험협회</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                      <a
                        href="http://www.knia.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 손해보험협회</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 교육신청 링크 */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      교육신청 바로가기
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="https://is.in.or.kr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-900 font-medium transition-all duration-150 active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span>🔗 교육신청 바로가기</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex-1 transition-all duration-150 active:scale-95"
                  >
                    이전으로
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 transition-all duration-150 active:scale-95"
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
  }

  // 질문 화면
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
                      <p className="text-gray-700 font-medium whitespace-pre-line">{questions[h.questionId].text}</p>
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

      {/* 현재 질문 */}
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
            <CardTitle className="text-xl font-bold text-gray-900 whitespace-pre-line">
              {currentQuestion.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleAnswer('yes')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-6 text-lg font-semibold transition-all duration-150 active:scale-95"
              >
                네
              </Button>
              <Button
                onClick={() => handleAnswer('no')}
                variant="outline"
                className="flex-1 py-6 text-lg font-semibold border-2 hover:bg-gray-100 transition-all duration-150 active:scale-95"
              >
                아니오
              </Button>
            </div>

            {history.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="w-full mt-4 transition-all duration-150 active:scale-95"
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
