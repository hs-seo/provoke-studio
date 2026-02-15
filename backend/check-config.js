#!/usr/bin/env node
require('dotenv').config();

console.log('\n🔍 백엔드 설정 확인\n');

const checks = [
  { name: 'PORT', value: process.env.PORT, required: false },
  { name: 'JWT_SECRET', value: process.env.JWT_SECRET, required: true },
  { name: 'GITHUB_CLIENT_ID', value: process.env.GITHUB_CLIENT_ID, required: true },
  { name: 'GITHUB_CLIENT_SECRET', value: process.env.GITHUB_CLIENT_SECRET, required: true },
  { name: 'GITHUB_CALLBACK_URL', value: process.env.GITHUB_CALLBACK_URL, required: false },
];

let hasError = false;

checks.forEach(({ name, value, required }) => {
  const isSet = value && value !== '' && !value.includes('your_') && !value.includes('여기에');

  if (required && !isSet) {
    console.log(`❌ ${name}: 설정되지 않음 또는 기본값`);
    hasError = true;
  } else if (isSet) {
    const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${name}: ${displayValue}`);
  } else {
    console.log(`⚠️  ${name}: 미설정 (선택사항)`);
  }
});

console.log('\n');

if (hasError) {
  console.log('❌ .env 파일을 확인하고 GitHub OAuth 정보를 입력해주세요.');
  console.log('\n📝 설정 방법:');
  console.log('1. https://github.com/settings/developers 접속');
  console.log('2. "New OAuth App" 클릭');
  console.log('3. Client ID와 Secret을 .env 파일에 입력');
  console.log('\n');
  process.exit(1);
} else {
  console.log('✅ 모든 필수 설정이 완료되었습니다!');
  console.log('👉 npm run dev 로 서버를 시작하세요.\n');
  process.exit(0);
}
