const fs = require('fs');
const path = require('path');

// 프로덕션 빌드 시 API Route를 임시로 이동
const apiRoutePath = path.join(__dirname, '..', 'app', 'api', 'sheets', 'route.ts');
const tempApiRoutePath = path.join(__dirname, '..', 'app', 'api', 'sheets', 'route.ts.temp');

if (process.env.NODE_ENV === 'production' && fs.existsSync(apiRoutePath)) {
  console.log('📦 프로덕션 빌드: API Route를 임시로 이동합니다...');
  fs.renameSync(apiRoutePath, tempApiRoutePath);
}

