import { messaging } from 'firebase-admin'
import { Types } from 'mongoose'

// This interface feels cleaner than inlining it in the
// sendToUser definition
interface sendToUserData {
  title: string
  text: string
  data: {
    path: string
  }
  tokens: string[]
}

// Until the Session model is converted to TS,
// we need to represent the parts of it used in
// sendToVolunteer() here. When that model conversion
// is done, this can be refactored to use that model directly.
interface Session {
  type: string
  subTopic: string
  _id: Types.ObjectId
}

const sendToUser = ({ title, text, data, tokens }: sendToUserData) => {
  return messaging().sendMulticast({
    tokens, // can also send to a topic (group of people)
    // ios and android process data a little differently, so setup separate objects for each
    apns: {
      payload: Object.assign(
        {
          data
        },
        {
          aps: {
            alert: {
              title: title,
              body: text,
              'content-available': 1
            }
          }
        }
      )
    },
    android: {
      // TS says this needs to be a string,
      // of 'high' | 'normal'
      // Guessing that 1 is equivalent with 'high'
      priority: 'high',
      data: {
        title: title,
        body: text,
        message: text,
        // image: imageUrl,
        payload: JSON.stringify(data),
        'content-available': '1',
        // type: message.type,
        icon: 'notification_icon',
        color: '#16d2aa'
      }
    }
  })
}

export default {
  sendVolunteerJoined: async function(session: Session, tokens: string[]) {
    const { type, subTopic, _id } = session
    const data = {
      title: 'We found a volunteer!',
      text: 'Start chatting with your coach now.',
      data: {
        path: `/session/${type}/${subTopic}/${_id}`
      },
      tokens
    }

    return sendToUser(data)
  }
}
