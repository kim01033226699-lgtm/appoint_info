'use client'

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ResultPage from "@/components/result-page";

function ResultContent() {
  const searchParams = useSearchParams();
  const date = searchParams.get('date') || '';

  return <ResultPage selectedDate={date} />;
}

export default function Result() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}
