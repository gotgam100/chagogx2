const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase v10 + Expo SDK 54 호환성 패치
// Metro의 package.exports 지원이 Firebase의 react-native 엔트리포인트
// 해석을 막는 이슈 회피. ("Component auth has not been registered yet" 에러)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
