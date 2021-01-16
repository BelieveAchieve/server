module.exports = {
  preset: '@shelf/jest-mongodb',
  setupFiles: ['./tests/global.ts'],
  watchPathIgnorePatterns: ['globalConfig']
}
