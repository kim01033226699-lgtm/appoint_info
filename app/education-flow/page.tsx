import EducationQuestionFlow from "@/components/education-flow/education-question-flow";
import NavigationHeader from "@/components/navigation-header";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <NavigationHeader />

      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* 질문 플로우 */}
          <EducationQuestionFlow />
        </div>
      </div>
    </div>
  );
}
