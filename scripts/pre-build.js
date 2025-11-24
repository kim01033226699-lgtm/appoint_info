const fs = require('fs');
const path = require('path');

// 빌드 시 API Route를 임시로 이동 (정적 내보내기에서는 API Route 사용 불가)
const apiRoutePath = path.join(__dirname, '..', 'app', 'api', 'sheets', 'route.ts');
const tempApiRoutePath = path.join(__dirname, '..', 'app', 'api', 'sheets', 'route.ts.temp');

if (fs.existsSync(apiRoutePath)) {
  console.log('📦 빌드: API Route를 임시로 이동합니다...');
  fs.renameSync(apiRoutePath, tempApiRoutePath);
} else {
  console.log('ℹ️  API Route 파일이 없습니다. (이미 이동되었거나 존재하지 않음)');
}

