const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Cung cấp đường dẫn đến ứng dụng Next.js của bạn để tải next.config.js và các tệp .env trong môi trường thử nghiệm của bạn
  dir: './',
});

// Thêm bất kỳ cấu hình Jest tùy chỉnh nào sẽ được chuyển sang Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Xử lý các alias đường dẫn (nếu bạn có cấu hình trong jsconfig.json hoặc tsconfig.json)
    '^@/(.*)$': '<rootDir>/$1',
  },
};

// createJestConfig được xuất theo cách này để đảm bảo rằng next/jest có thể tải cấu hình Next.js là async
module.exports = createJestConfig(customJestConfig);
