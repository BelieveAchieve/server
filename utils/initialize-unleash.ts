import { initialize } from 'unleash-client';
import config from '../config';

const initializeUnleash = (): void => {
  if (config.unleashId)
    initialize({
      url: config.unleashUrl,
      appName: config.unleashName,
      instanceId: config.unleashId
    });
};

export default initializeUnleash;
