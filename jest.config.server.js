module.exports = {
  preset: '@shelf/jest-mongodb',
  setupFiles: ['./server/tests/global.ts'],
  watchPathIgnorePatterns: ['globalConfig'],
  roots: ["./server"]
}
