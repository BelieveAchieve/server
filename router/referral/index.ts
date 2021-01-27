import express from 'express';
import UserService from '../../services/UserService';

const referralRouter = function(app): void {
  const router: any = express.Router(); // eslint-disable-line @typescript-eslint/no-explicit-any

  router.get('/:referralCode', async function(req, res, next) {
    const { referralCode } = req.params;

    try {
      const user = await UserService.getUser(
        { referralCode },
        {
          firstname: 1
        }
      );
      res.json({ user });
    } catch (err) {
      next(err);
    }
  });

  app.use('/api-public/referral', router);
};

module.exports = referralRouter;
export default referralRouter;
