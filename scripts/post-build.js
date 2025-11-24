const fs = require('fs');
const path = require('path');

// 빌드 후 API Route 복원
const apiRoutePath = path.join(__dirname, '..', 'app', 'api', 'sheets', 'route.ts');
const tempApiRoutePath = path.join(__dirname, '..', 'app', 'api', 'sheets', 'route.ts.temp');

if (process.env.NODE_ENV === 'production' && fs.existsSync(tempApiRoutePath)) {
  console.log('✅ 빌드 완료: API Route를 복원합니다...');
  fs.renameSync(tempApiRoutePath, apiRoutePath);
}

