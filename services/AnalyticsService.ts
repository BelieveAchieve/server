import PostHog from 'posthog-node';
import { Types } from 'mongoose';
import config from '../config';

const client = new PostHog(config.posthogToken, {
  host: 'https://app.posthog.com'
});

export const captureEvent = (
  userId: string | Types.ObjectId,
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: {
    action?: string;
    sessionId?: string;
    subject?: string;
    referenceEmail?: string;
    banReason?: string;
    joinedFrom?: string;
  }
): void => {
  let distinctId = '';
  if (Types.ObjectId.isValid(userId)) distinctId = userId.toString();
  else distinctId = userId as string;

  client.capture({
    distinctId,
    event: eventName,
    properties
  });
};

module.exports = {
  captureEvent
};
