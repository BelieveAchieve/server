import 'newrelic';
import mongoose from 'mongoose';
import { Static } from 'runtypes';
import initializeUnleash from './utils/initialize-unleash';
import rawConfig from './config';
import { Config } from './config-type';
import app from './app';

const main = (): void => {
  let config: Static<typeof Config>;

  try {
    config = Config.check(rawConfig);
  } catch (error) {
    console.trace(`${error.name}: ${error.message} [${error.key}]`);
    return;
  }

  initializeUnleash();

  // Database
  mongoose.connect(config.database, { useNewUrlParser: true });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.log('Connected to database');
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log('Listening on port ' + port);
  });
};

main();
