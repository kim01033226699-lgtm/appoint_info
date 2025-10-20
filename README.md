# 굿리치 위촉일정 조회 시스템

신규 위촉자(보험설계사)가 자신의 위촉 진행 상황과 관련된 복잡한 일정을 쉽고 명확하게 확인할 수 있도록 지원하는 모바일 우선 웹 애플리케이션입니다.

## 주요 기능

- ✅ **위촉 체크리스트**: 신규 위촉자가 완료해야 할 작업 목록 제공
- 📅 **위촉일정 조회**: 업로드 완료일(매주 수요일)을 선택하여 위촉 차수 및 상세 일정 조회
- 📆 **전체 캘린더**: 모든 위촉 관련 일정을 달력 형태로 시각화 (PC: 캘린더 뷰, 모바일: Agenda 뷰)
- 📄 **PDF 저장**: 조회된 위촉일정을 PDF로 다운로드
- 🔄 **구글 시트 연동**: 구글 시트에서 데이터를 자동으로 가져와 관리 (API 키 또는 서비스 계정 방식)
- 📊 **JSON 데이터 관리**: `public/data.json` 파일을 통해 데이터를 쉽게 관리

## 기술 스택

- **Framework**: Next.js 15 (App Router, Static Export)
- **Language**: TypeScript
- **UI**: React, ShadCN UI, Tailwind CSS
- **Data Source**: JSON 파일
- **Deployment**: GitHub Pages

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/goodrich-recruitment-schedule.git
cd goodrich-recruitment-schedule
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드된 정적 파일은 `out` 디렉토리에 생성됩니다.

## 데이터 관리

### 방법 1: 구글 시트 연동 (권장)

구글 시트에서 데이터를 관리하고 자동으로 가져올 수 있습니다.

```bash
# 구글 시트 데이터 가져오기
npm run fetch-data
```

자세한 설정 방법은 [`GOOGLE_SHEETS_GUIDE.md`](./GOOGLE_SHEETS_GUIDE.md)를 참조하세요.

### 방법 2: JSON 파일 직접 수정

모든 데이터는 `public/data.json` 파일에서 관리됩니다. 이 파일을 직접 수정하여 내용을 업데이트할 수 있습니다.

### 데이터 구조

```json
{
  "requiredDocuments": "위촉에 필요한 서류 목록",
  "checklist": [
    {
      "id": "1",
      "text": "체크리스트 항목"
    }
  ],
  "schedules": [
    {
      "round": "10-3차",
      "deadline": "10/27(월)",
      "gpOpenDate": "10/27(월)",
      "gpOpenTime": "PM16:00",
      "companies": [
        {
          "company": "회사명",
          "round": "차수",
          "acceptanceDeadline": "접수마감일",
          "gpUploadDate": "GP업로드",
          "recruitmentMethod": "위촉방법",
          "manager": "담당자"
        }
      ]
    }
  ],
  "calendarEvents": [
    {
      "id": "1",
      "date": "2025-10-01",
      "title": "[위촉] 삼성생명 - 접수마감",
      "type": "company"
    }
  ]
}
```

**이벤트 타입**: `goodrich`, `company`, `session`

## 프로젝트 구조

```
├── app/
│   ├── result/
│   │   └── page.tsx            # 결과 페이지
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 메인 페이지
│   └── globals.css             # 전역 스타일
├── components/
│   ├── ui/                     # ShadCN UI 컴포넌트
│   ├── calendar-modal.tsx      # 전체 캘린더 모달
│   ├── main-page.tsx           # 메인 페이지 컴포넌트
│   └── result-page.tsx         # 결과 페이지 컴포넌트
├── lib/
│   ├── types.ts                # TypeScript 타입 정의
│   └── utils.ts                # 유틸리티 함수
├── public/
│   └── data.json               # 데이터 파일
└── README.md
```

## GitHub Pages 배포

이 프로젝트는 GitHub Actions를 통해 자동으로 배포됩니다.

### 배포 설정

1. GitHub 저장소 생성 및 코드 푸시

2. GitHub 저장소 Settings > Pages로 이동

3. Source를 **GitHub Actions**로 설정

4. `main` 브랜치에 푸시하면 자동으로 배포됩니다

5. 배포된 사이트 URL: `https://your-username.github.io/goodrich-recruitment-schedule/`

### basePath 수정

`next.config.ts` 파일에서 `basePath`를 저장소 이름에 맞게 수정하세요:

```typescript
basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
```

## 데이터 업데이트 방법

### 구글 시트 사용 시

1. 구글 시트에서 데이터를 수정합니다
2. 로컬: `npm run fetch-data` 실행
3. GitHub: 코드를 푸시하면 자동으로 최신 데이터를 가져와 배포됩니다

### JSON 파일 직접 수정 시

1. `public/data.json` 파일을 수정합니다
2. 변경사항을 커밋하고 푸시합니다
3. GitHub Actions가 자동으로 배포합니다

## 로컬 테스트

빌드된 정적 파일을 로컬에서 테스트하려면:

```bash
npm run build
npx serve@latest out
```

## 라이선스

이 프로젝트는 굿리치 내부 사용을 위한 것입니다.

## 지원

문의사항이나 버그 리포트는 담당 부서로 연락주시기 바랍니다.
