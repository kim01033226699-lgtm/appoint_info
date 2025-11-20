# 온보딩 페이지 작업 로그

## 2025-11-13 작업 내역

### 완료된 작업
1. ✅ 기획서(0.온보딩기획.md)와 현재 구현 비교 및 누락 기능 구현
   - 구글시트 데이터에서 차수(round), 협회등록일 파싱 추가
   - 스케줄 찾기 로직 개선

2. ✅ 질문 흐름을 순차적으로 변경
   - 한번에 모든 질문 표시 → 하나씩 순차적으로 표시
   - 협회말소 예/아니오에 따른 조건부 질문 추가

3. ✅ 입력 검증 추가
   - 소속/이름 2자 이상 입력 필수
   - 실시간 에러 메시지 표시

4. ✅ **입력 버그 수정 (중요!)**
   - **문제 증상**:
     - 소속/이름 입력 필드에서 한 글자만 입력되고 입력이 멈춤
     - 다시 입력하려면 input 필드를 클릭해야 함
     - 한글/영어 모두 동일한 문제 발생
     - 예: "김"을 입력하려고 하면 "ㄱ"만 입력되고 포커스가 사라짐

   - **시도한 해결 방법들** (실패):
     1. ❌ onChange 핸들러를 inline에서 별도 함수로 분리
     2. ❌ 한글 IME composition 이벤트 처리 추가
     3. ❌ Input 컴포넌트를 native input 엘리먼트로 교체
     4. ❌ useCallback으로 핸들러 메모이제이션
     5. ❌ IME의 빈 문자열 값 무시 로직 추가
     6. ❌ input 엘리먼트에 key prop 추가

   - **근본 원인 발견**:
     ```typescript
     // 문제 코드 (OnboardingPage 컴포넌트 내부)
     const Step1Content = () => (
       <Card>
         <input value={data.department} onChange={handleDepartmentChange} />
       </Card>
     );
     ```
     - `Step1Content`가 OnboardingPage 컴포넌트 내부에서 정의됨
     - `data` state가 변경될 때마다 OnboardingPage가 리렌더링됨
     - 리렌더링 시 `Step1Content`가 새로운 함수로 재생성됨
     - React가 이를 완전히 새로운 컴포넌트로 인식
     - input DOM 엘리먼트가 언마운트 후 다시 마운트됨
     - 결과: 포커스와 IME 조합 상태가 초기화됨

   - **최종 해결 방법**:
     ```typescript
     // 해결 코드 (OnboardingPage 외부로 추출)
     interface Step1ContentProps {
       department: string;
       name: string;
       onDepartmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
       onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
       onNext: () => void;
     }

     const Step1Content = React.memo(({
       department,
       name,
       onDepartmentChange,
       onNameChange,
       onNext
     }: Step1ContentProps) => {
       return (
         <Card>
           <input value={department} onChange={onDepartmentChange} />
         </Card>
       );
     });

     // 사용
     {step === 1 && <Step1Content
       department={data.department}
       name={data.name}
       onDepartmentChange={handleDepartmentChange}
       onNameChange={handleNameChange}
       onNext={() => setStep(2)}
     />}
     ```

     **핵심 변경사항**:
     1. Step1Content를 OnboardingPage 외부로 추출
     2. Props interface 정의하여 타입 안정성 확보
     3. React.memo()로 래핑하여 props가 변경되지 않으면 리렌더링 방지
     4. data를 직접 참조하지 않고 props로 받도록 변경
     5. 핸들러들을 useCallback으로 메모이제이션 유지

     **결과**:
     - input 엘리먼트의 DOM identity가 유지됨
     - 포커스가 사라지지 않음
     - 한글 IME 조합 상태가 유지됨
     - 연속 타이핑 가능 (한글/영어 모두)

   - 파일: `app/onboarding/page.tsx` (lines 61-125, 1067-1073)

### 주요 변경 파일
- `app/onboarding/page.tsx` - 메인 온보딩 페이지 컴포넌트
- `scripts/fetch-sheets-data-public.js` - 구글시트 데이터 파싱 로직

### 현재 상태
- ✅ 빌드 성공 (Next.js 15.5.6)
- ✅ 서버 실행 중: http://localhost:3001/onboarding/
- ✅ 입력 필드 정상 작동 (한글/영문 연속 입력 가능)

### 다음 작업 시 확인사항
- 입력 필드에서 한글/영문 연속 입력이 잘 되는지 테스트
- 순차적 질문 흐름이 의도대로 작동하는지 확인
- 차수 찾기 로직이 실제 데이터로 정상 작동하는지 검증

### 기술적 포인트
- React.memo 사용하여 불필요한 리렌더링 방지
- useCallback으로 핸들러 함수 메모이제이션
- controlled component의 state 관리 최적화
