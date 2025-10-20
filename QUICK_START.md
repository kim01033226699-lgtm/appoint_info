# 빠른 시작 가이드

## 현재 상태

현재 프로젝트는 `public/data.json` 파일의 샘플 데이터를 사용합니다.

## 옵션 1: 샘플 데이터로 바로 사용

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인하세요!

## 옵션 2: 구글 시트 연동

### A. 공개 구글 시트 사용 (간단)

1. 구글 시트를 "링크가 있는 모든 사용자" 공개로 설정
2. `GOOGLE_SHEETS_GUIDE.md`의 "방법 1" 참조
3. 데이터 구조에 맞게 시트 작성

### B. 비공개 구글 시트 사용 (안전)

**로컬 개발:**
```bash
# 1. .env 파일 생성
cp .env.example .env

# 2. Google Cloud Console에서 서비스 계정 생성
#    (자세한 방법은 GOOGLE_SHEETS_GUIDE.md 참조)

# 3. .env 파일에 정보 입력
GOOGLE_SHEETS_PRIVATE_KEY="..."
GOOGLE_SHEETS_CLIENT_EMAIL="..."
GOOGLE_SHEETS_SPREADSHEET_ID="..."

# 4. 데이터 가져오기
npm run fetch-data

# 5. 개발 서버 실행
npm run dev
```

**GitHub Pages 배포:**
```bash
# 1. GitHub 저장소 Settings > Secrets and variables > Actions
# 2. 다음 3개 시크릿 추가:
#    - GOOGLE_SHEETS_PRIVATE_KEY
#    - GOOGLE_SHEETS_CLIENT_EMAIL
#    - GOOGLE_SHEETS_SPREADSHEET_ID

# 3. 코드 푸시하면 자동 배포!
git add .
git commit -m "Add Google Sheets integration"
git push
```

## 구글 시트 데이터 구조

프로젝트는 다음 3개의 시트를 사용합니다:

### 시트 1: `설정` (A2:B부터)
```
| A열 (키)     | B열 (값) |
|-------------|----------|
| 위촉필요서류 | 이력서,신분증,통장,등본,수료증... |
| 체크리스트   | 서울 보증보험 동의 및 결과 확인 |
| 체크리스트   | 위촉서류 업로드 완료 |
```

### 시트 2: `위촉문자` (A2:D부터)
```
| A열 (회사명) | B열 (메모)    | C열 (담당자) | D열 (전화) |
|-------------|--------------|-------------|-----------|
| kb라이프     | 문자(SMS)발송 | 김보미       | 010-1234  |
```

### 시트 3: `입력` (A2:F부터)
```
| A열 (날짜)  | B열 (카테고리) | C열 (회사) | D열 (차수) | E열 (내용)                    | F열 (GP업로드) |
|-----------|---------------|-----------|-----------|------------------------------|---------------|
| 2025-10-27| 굿리치 일정     |           | 10-3차    | 10/27(월) GP오픈예정(PM16:00)|               |
| 2025-10-20| 위촉           | KB라이프   | 10-3차    |                              | 2025-10-30    |
```

**카테고리**: `굿리치 일정`(goodrich), `위촉`(company), `세종`/`협회`(session)

## 문제 해결

### 구글 시트 연동 오류
```bash
# 에러 확인
npm run fetch-data

# 권한 확인
# - 서비스 계정이 시트에 뷰어 권한이 있는지 확인
# - SPREADSHEET_ID가 정확한지 확인
```

### 빌드 오류
```bash
# 캐시 삭제 후 재빌드
rm -rf .next out node_modules
npm install
npm run build
```

## 주요 명령어

```bash
npm run dev         # 개발 서버 실행
npm run fetch-data  # 구글 시트 데이터 가져오기
npm run build       # 프로덕션 빌드
```

## 데이터 업데이트

1. 구글 시트 수정
2. `npm run fetch-data` 실행 (또는 GitHub에 푸시)
3. 브라우저 새로고침

## 더 자세한 정보

- 구글 시트 연동: `GOOGLE_SHEETS_GUIDE.md`
- 전체 가이드: `README.md`
