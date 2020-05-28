import { promisify } from 'util';

const promisifyLogin = (req, res, next): void => {
  req.login = promisify(req.login);
  next();
};

export default promisifyLogin;
