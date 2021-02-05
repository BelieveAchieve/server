import { Types } from 'mongoose'
import Session from '../models/Session'
import MessageModel, { MessageDocument } from '../models/Message'
import getSessionRoom from '../utils/get-session-room'

class SocketService {
  private io

  constructor(io) {
    this.io = io
  }

  /**
   * Get session data to send to client for a given session ID
   * @param sessionId
   * @returns the session object
   */
  private async getSessionData(
    sessionId: Types.ObjectId | string
  ): Promise<MessageDocument> {
    const populateOptions = [
      { path: 'student', select: 'firstname isVolunteer' },
      { path: 'volunteer', select: 'firstname isVolunteer' }
    ]

    const populatedSession = await Session.findById(sessionId)
      .populate(populateOptions)
      .exec()

    return MessageModel.populate(populatedSession, {
      path: 'messages.user',
      select: 'firstname isVolunteer'
    })
  }

  async updateSessionList(): Promise<void> {
    const sessions = await Session.getUnfulfilledSessions()
    this.io.in('volunteers').emit('sessions', sessions)
  }

  async emitSessionChange(sessionId: Types.ObjectId | string): Promise<void> {
    const session = await this.getSessionData(sessionId)
    this.io.in(getSessionRoom(sessionId)).emit('session-change', session)

    await this.updateSessionList()
  }

  bump(socket, data, err): void {
    console.log('Could not join session')
    console.log(err)
    socket.emit('bump', data, err.toString())
  }
}

module.exports = SocketService
export default SocketService
