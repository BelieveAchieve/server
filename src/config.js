const configElement = document.getElementById('config')

const config = {}

let passedConfig
if (configElement !== null) {
  passedConfig = JSON.parse(configElement.innerHTML)
  // the local dev server won't interpolate in the values so we need
  // to provide defaults for that case
  // if there's no interpolation the object will include straight string values
  // of the mustache templates, so we can look for that
  passedConfig.mainWebsiteUrl.includes('{{')
    ? (config.mainWebsiteUrl = process.env.VUE_APP_MAIN_WEBSITE_URL)
    : (config.mainWebsiteUrl = passedConfig.mainWebsiteUrl)
  passedConfig.serverRoot.includes('{{')
    ? (config.serverRoot = process.env.VUE_APP_SERVER_ROOT)
    : (config.serverRoot = passedConfig.serverRoot)
  passedConfig.socketAddress.includes('{{')
    ? (config.socketAddress = process.env.VUE_APP_SOCKET_ADDRESS)
    : (config.socketAddress = passedConfig.socketAddress)
  passedConfig.websocketRoot.includes('{{')
    ? (config.websocketRoot = process.env.VUE_APP_WEBSOCKET_ROOT)
    : (config.websocketRoot = passedConfig.websocketRoot)
  passedConfig.zwibblerUrl.includes('{{')
    ? (config.zwibblerUrl = process.env.VUE_APP_ZWIBBLER_URL)
    : (config.zwibblerUrl = passedConfig.zwibblerUrl)
  passedConfig.posthogToken.includes('{{')
    ? (config.posthogToken = process.env.VUE_APP_POSTHOG_TOKEN)
    : (config.posthogToken = passedConfig.posthogToken)
  passedConfig.unleashUrl.includes('{{')
    ? (config.unleashUrl = process.env.VUE_APP_UNLEASH_URL)
    : (config.unleashUrl = passedConfig.unleashUrl)
  passedConfig.unleashName.includes('{{')
    ? (config.unleashName = process.env.VUE_APP_UNLEASH_NAME)
    : (config.unleashName = passedConfig.unleashName)
  passedConfig.unleashId.includes('{{')
    ? (config.unleashId = process.env.VUE_APP_UNLEASH_ID)
    : (config.unleashId = passedConfig.unleashId)
} else {
  // tests don't include the index.html file
  // so we have to populate these without it
  config.mainWebsiteUrl = process.env.VUE_APP_MAIN_WEBSITE_URL
  config.serverRoot = process.env.VUE_APP_SERVER_ROOT
  config.socketAddress = process.env.VUE_APP_WEBSOCKET_ADDRESS
  config.websocketRoot = process.env.VUE_APP_MAIN_WEBSOCKET_ROOT
  config.zwibblerUrl = process.env.VUE_APP_ZWIBBLER_URL
  config.posthogToken = process.env.VUE_APP_POSTHOG_TOKEN
  config.unleashUrl = process.env.VUE_APP_UNLEASH_URL
  config.unleashName = process.env.VUE_APP_UNLEASH_NAME
  config.unleashId = process.env.VUE_APP_UNLEASH_ID
}

export default config
