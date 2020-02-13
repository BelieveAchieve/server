// Fallback util in the case that ua-parser-js can't determine a device
const getDeviceFromUserAgent = userAgent => {
  let device = 'Unknown'
  const userAgentDevices = {
    'Generic Linux': /Linux/i,
    Android: /Android/i,
    BlackBerry: /BlackBerry/i,
    Bluebird: /EF500/i,
    'Chrome OS': /CrOS/i,
    Datalogic: /DL-AXIS/i,
    Honeywell: /CT50/i,
    iPad: /iPad/i,
    iPhone: /iPhone/i,
    iPod: /iPod/i,
    Mac: /Macintosh/i,
    Windows: /IEMobile|Windows/i,
    Zebra: /TC70|TC55/i
  }
  Object.keys(userAgentDevices).forEach(item => {
    if (userAgent.match(userAgentDevices[item])) {
      device = item
    }
  })
  return device
}

module.exports = getDeviceFromUserAgent
