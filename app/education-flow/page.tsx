import EducationQuestionFlow from "@/components/education-flow/education-question-flow";
import NavigationHeader from "@/components/navigation-header";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <NavigationHeader />

      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* 제목 */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            보수등록교육 안내
          </h1>

          {/* 설명 */}
          <div className="text-center mb-8">
            <p className="text-gray-600">
              몇 가지 질문을 통해 필요한 교육 과정을 안내해드립니다.
            </p>
          </div>

          {/* 질문 플로우 */}
          <EducationQuestionFlow />
        </div>
      </div>
    </div>
  );
}
