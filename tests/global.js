jest.mock('redis', () => {
  const redisMock = require('fakeredis')
  return {
    __esModule: true,
    default: redisMock
  }
})
