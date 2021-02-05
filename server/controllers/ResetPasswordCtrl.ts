import { randomBytes } from 'crypto'
import { sendReset } from '../services/MailService'
import UserModel from '../models/User'

export interface FinishResetOptions {
  email: string
  password: string
  token: string
}

export async function initiateReset(email: string): Promise<void> {
  const user = await UserModel.findOne({ email })
  if (!user) {
    throw new Error('No account with that id found.')
  }

  const buffer: Buffer = randomBytes(16)
  const token = buffer.toString('hex')
  user.passwordResetToken = token
  try {
    await user.save()
  } catch (error) {
    throw new Error(error.message)
  }

  await sendReset({ email, token })
}

export async function finishReset(options: FinishResetOptions): Promise<void> {
  const { email, password, token } = options
  // make sure token is a valid 16-byte hex string
  if (!token.match(/^[a-f0-9]{32}$/)) {
    // early exit
    throw new Error('Invalid password reset token')
  }

  try {
    const user = await UserModel.findOne({ passwordResetToken: token })

    if (!user) throw new Error('No user found with that password reset token')

    if (user.email !== email)
      throw new Error('Email did not match the password reset token')

    user.passwordResetToken = undefined
    user.password = await user.hashPassword(password)
    await user.save()
  } catch (error) {
    throw new Error(error.message)
  }
}
