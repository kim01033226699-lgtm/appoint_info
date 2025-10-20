# 구글 시트 연동 가이드

## 방법 1: API 키 방식 (공개 시트)

민감한 정보가 없다면 가장 간단한 방법입니다.

### 1단계: 구글 시트를 공개로 설정

1. 구글 시트를 엽니다
2. 우측 상단 **공유** 버튼 클릭
3. **일반 액세스**를 "링크가 있는 모든 사용자"로 변경
4. 권한을 **뷰어**로 설정

### 2단계: Google API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. **API 및 서비스 > 라이브러리** 클릭
4. "Google Sheets API" 검색 후 **사용 설정**
5. **API 및 서비스 > 사용자 인증 정보** 클릭
6. **사용자 인증 정보 만들기 > API 키** 선택
7. 생성된 API 키 복사

### 3단계: 스프레드시트 ID 확인

구글 시트 URL에서 ID를 복사합니다:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

### 4단계: 환경 변수 설정

`.env` 파일 생성:
```bash
GOOGLE_SHEETS_API_KEY=your_api_key_here
GOOGLE_SHEET_ID=your_spreadsheet_id_here
```

### 5단계: 구글 시트 데이터 구조 설정

다음과 같이 3개의 시트를 생성합니다:

#### 시트 1: `설정` (A2:B부터 시작)
| A열 | B열 |
|-----|-----|
| 위촉필요서류 | 이력서,신분증,통장,등본,수료증,합격증(신입만 해당),경력증명서(교보생명위촉용) |
| 체크리스트 | 서울 보증보험 동의 및 결과 확인 |
| 체크리스트 | 위촉서류 업로드 완료 |
| 체크리스트 | 위촉계약서 전자서명 완료 |

**설명**:
- A열: 설정 키 (`위촉필요서류` 또는 `체크리스트`)
- B열: 설정 값

#### 시트 2: `위촉문자` (A2:D부터 시작)
| A열 (회사명) | B열 (메모) | C열 (담당자명) | D열 (전화번호) |
|-----|-----|-----|-----|
| kb라이프 | 문자(SMS) 발송 | 김보미 | 010-1234-5678 |
| 삼성생명 | 온라인 접수 | 이철수 | 010-9876-5432 |

**설명**:
- A열: 회사명 (소문자로 저장, 매칭 시 대소문자 무시)
- B열: 위촉 방법 메모
- C열: 담당자 이름
- D열: 담당자 전화번호

#### 시트 3: `입력` (A2:F부터 시작)
| A열 (날짜) | B열 (카테고리) | C열 (회사) | D열 (차수) | E열 (내용) | F열 (GP업로드) |
|-----|-----|-----|-----|-----|-----|
| 2025-10-27 | 굿리치 일정 |  | 10-3차 | 10/27(월) GP 오픈 예정 (PM16:00)\n자격추가/전산승인마감 |  |
| 2025-10-20 | 위촉 | KB라이프 | 10-3차 |  | 2025-10-30 |
| 2025-10-01 | 위촉 | 삼성생명 | 10-2차 | 접수마감 |  |

**설명**:
- A열: 날짜 (YYYY-MM-DD, M/D, 또는 Excel 날짜 직렬 번호)
- B열: 카테고리 (`굿리치 일정`, `위촉`, `세종`, `협회` 등)
- C열: 회사명 (위촉 카테고리인 경우)
- D열: 차수 (예: `10-3차`, `6-3차/6-4차` - 여러 차수는 `/` 또는 `,`로 구분)
- E열: 내용 (GP 오픈 일정 포함 가능)
- F열: GP 업로드 날짜

**중요한 입력 규칙**:
1. **굿리치 일정** 행에서 E열에 GP 오픈 정보를 포함:
   - 형식: `M/D(요일) GP 오픈 예정 (시간)`
   - 예: `10/27(월) GP 오픈 예정 (PM16:00)`
   - 마감일은 별도 행에 "자격추가/전산승인마감" 키워드 포함

2. **위촉** 카테고리 행은 생명보험사별 접수 마감일 정보
   - C열에 회사명, D열에 해당 차수 입력
   - F열에 GP 업로드 날짜 입력 (선택사항)

---

## 방법 2: 서비스 계정 방식 (비공개 시트)

민감한 정보가 있다면 이 방법을 사용하세요. 빌드 시점에만 데이터를 가져옵니다.

### 1단계: Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. **API 및 서비스 > 라이브러리** 클릭
4. "Google Sheets API" 검색 후 **사용 설정**

### 2단계: 서비스 계정 생성

1. **API 및 서비스 > 사용자 인증 정보** 클릭
2. **사용자 인증 정보 만들기 > 서비스 계정** 선택
3. 서비스 계정 이름 입력 후 **만들기**
4. 역할은 선택하지 않고 **완료**
5. 생성된 서비스 계정 클릭
6. **키 > 키 추가 > 새 키 만들기**
7. JSON 형식 선택 후 다운로드

### 3단계: 구글 시트 권한 부여

1. 구글 시트 열기
2. **공유** 버튼 클릭
3. 다운로드한 JSON 파일의 `client_email` 값을 복사
4. 해당 이메일을 **뷰어** 권한으로 추가

### 4단계: 로컬 개발 환경 설정

`.env` 파일 생성:
```bash
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

**⚠️ 중요**:
- `private_key`는 `-----BEGIN PRIVATE KEY-----`부터 `-----END PRIVATE KEY-----`까지 전체를 포함해야 합니다
- 줄바꿈(`\n`)도 그대로 포함해야 합니다

### 5단계: GitHub Secrets 설정 (배포용)

1. GitHub 저장소 > **Settings > Secrets and variables > Actions** 클릭
2. **New repository secret** 클릭
3. 다음 시크릿 추가:

- `GOOGLE_SHEETS_PRIVATE_KEY`: JSON 파일의 `private_key` 값 전체
- `GOOGLE_SHEETS_CLIENT_EMAIL`: JSON 파일의 `client_email` 값
- `GOOGLE_SHEETS_SPREADSHEET_ID`: 구글 시트 ID

### 6단계: 데이터 가져오기 테스트

```bash
# 로컬에서 테스트
npm run fetch-data

# 성공하면 다음과 같은 메시지가 표시됩니다:
# ✅ 구글 시트 데이터를 성공적으로 가져왔습니다!
#    - 필요서류: 이력서,신분증,통장...
#    - 체크리스트: 3개 항목
#    - 위촉일정: 2개 차수
#    - 캘린더 이벤트: 15개
```

---

## 스크립트 작동 방식

프로젝트에 포함된 `scripts/fetch-sheets-data.js`는 다음과 같이 작동합니다:

1. **자동 인증 방식 선택**:
   - `GOOGLE_SHEETS_API_KEY`가 있으면 방법 1 (API 키) 사용
   - 없으면 방법 2 (서비스 계정) 사용

2. **시트 데이터 가져오기**:
   - `설정!A2:B` - 관리자 설정 (필요서류, 체크리스트)
   - `입력!A2:F` - 일정 입력 데이터
   - `위촉문자!A2:D` - 회사별 위촉 방법 및 담당자 정보

3. **데이터 파싱 및 변환**:
   - 날짜 자동 파싱 (YYYY-MM-DD, M/D, Excel 직렬 번호 지원)
   - 차수별 스케줄 그룹화
   - 캘린더 이벤트 자동 생성
   - 회사명 매칭 및 담당자 정보 결합

4. **결과 저장**: `public/data.json`에 저장

---

## 보안 체크리스트

### ✅ 해야 할 것
- GitHub Secrets에 API 키 또는 서비스 계정 정보 저장
- 서비스 계정에 최소 권한만 부여 (뷰어)
- `.env` 파일을 `.gitignore`에 추가 (이미 포함됨)
- API 키를 코드에 직접 작성하지 않기

### ❌ 하지 말아야 할 것
- API 키나 Private Key를 코드에 하드코딩
- `.env` 파일을 Git에 커밋
- 공개 저장소에 민감한 정보 노출
- 불필요한 권한 부여

---

## 추천 방식

**민감한 정보가 없는 경우**: 방법 1 (API 키 방식)
**민감한 정보가 있는 경우**: 방법 2 (서비스 계정 방식)

---

## 로컬 개발 가이드

### 방법 1 사용 시:
```bash
# .env 파일 생성
GOOGLE_SHEETS_API_KEY=your_api_key_here
GOOGLE_SHEET_ID=your_spreadsheet_id_here

# 데이터 가져오기
npm run fetch-data

# 개발 서버 실행
npm run dev
```

### 방법 2 사용 시:
```bash
# .env 파일 생성
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# 데이터 가져오기
npm run fetch-data

# 개발 서버 실행
npm run dev
```

---

## GitHub Pages 배포

프로젝트를 GitHub에 푸시하면 GitHub Actions가 자동으로:
1. 환경 변수에서 Google Sheets 인증 정보 로드
2. `npm run fetch-data` 실행하여 최신 데이터 가져오기
3. Next.js 빌드 실행
4. GitHub Pages에 배포

**필수**: GitHub Secrets에 인증 정보를 미리 설정해야 합니다.

---

## 문제 해결

### 오류: "GOOGLE_SHEETS_SPREADSHEET_ID 또는 GOOGLE_SHEET_ID가 설정되지 않았습니다"
- `.env` 파일에 스프레드시트 ID를 설정했는지 확인
- 환경 변수가 제대로 로드되는지 확인

### 오류: "The caller does not have permission"
- 서비스 계정 이메일이 구글 시트에 뷰어 권한으로 추가되었는지 확인
- API 키 방식의 경우 시트가 "링크가 있는 모든 사용자"로 공개되었는지 확인

### 데이터가 제대로 파싱되지 않음
- 구글 시트의 시트 이름이 정확한지 확인: `설정`, `입력`, `위촉문자`
- 데이터가 올바른 열에 입력되었는지 확인
- 날짜 형식이 맞는지 확인 (YYYY-MM-DD, M/D 등)
