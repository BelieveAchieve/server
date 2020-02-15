const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

const UTC_TO_HOUR_MAPPING = {
  0: '12a',
  1: '1a',
  2: '2a',
  3: '3a',
  4: '4a',
  5: '5a',
  6: '6a',
  7: '7a',
  8: '8a',
  9: '9a',
  10: '10a',
  11: '11a',
  12: '12p',
  13: '1p',
  14: '2p',
  15: '3p',
  16: '4p',
  17: '5p',
  18: '6p',
  19: '7p',
  20: '8p',
  21: '9p',
  22: '10p',
  23: '11p'
}

module.exports = {
  DAYS,
  UTC_TO_HOUR_MAPPING
}
