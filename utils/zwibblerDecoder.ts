export interface Message {
  messageType: MessageType;
  more: 0 | 1;
  protocolVersion: number;
  maxSize: number;
  creationMode: 0 | 1 | 2;
  offset: 0;
  docIDLength: number;
  docID: string;
  data: string;
}

export enum MessageType {
  INIT = 1,
  APPEND = 2,
  SET_KEY = 3,
  BROADCAST = 4,
  ERROR = 128,
  ACK_NACK = 129,
  KEY_INFORMATION = 130,
  SET_KEY_ACK_NACK = 131,
  CONTINUATION = 255
}

export enum DecodeError {
  'UNSPECIFIED' = 0,
  'DOES_NOT_EXIST' = 1,
  'ALREADY_EXISTS' = 2,
  'INVALID_OFFSET' = 3,
  'UNIMPLEMENTED_ERROR' = 4
}

export enum CreationMode {
  'POSSIBLY_CREATE' = 0,
  'NEVER_CREATE' = 1,
  'ALWAYS_CREATE' = 2
}

// Describes a field in the binary encoding of a message. Used to translate
// to/from a json structure.
interface FieldDescriptor {
  length: number;
  type: number;
  name: string;
  decoder?: { [key: number]: string };
}

// Message types
// const INIT = 0x01;
// const ERROR = 0x80;
// const ACK_NACK = 0x81;
// const KEY_INFORMATION = 0x82;
// const SET_KEY_ACK_NACK = 0x83;
// const APPEND = 0x02;
// const SET_KEY = 0x03;
// const BROADCAST = 0x04;
// const CONTINUATION = 0xff;

const MESSAGE_TYPES = {
  0x01: 'INITIAL CONNECTION',
  0x02: 'APPEND',
  0x03: 'SET-KEY',
  0x04: 'BROADCAST',
  0x80: 'ERROR',
  0x81: 'ACK/NACK',
  0x82: 'KEY-INFORMATION',
  0x83: 'SET-KEY-ACK',
  0xff: 'CONTINUATION'
};

// for type field in FieldDescriptor
const NUMBER = 0;
const STRING = 1;
const REPEAT_TO_END = 2;

const DECODE_MORE = {
  0: 'No',
  1: 'Yes'
};

const DECODE_CREATION_MODE = {
  0x00: 'POSSIBLY_CREATE',
  0x01: 'NEVER_CREATE',
  0x02: 'ALWAYS_CREATE'
};

const DECODE_ERROR = {
  0x0000: 'UNSPECIFIED',
  0x0001: 'DOES_NOT_EXIST',
  0x0002: 'ALREADY_EXISTS',
  0x0003: 'INVALID_OFFSET'
};

const DECODE_ACK_NACK = {
  0x00: 'NACK',
  0x01: 'ACK'
};

const DECODE_KEY_LIFETIME = {
  0x00: 'CLIENT-LIFETIME',
  0x01: 'SESSION-LIFETIME'
};

// const enum CreateMode {
//   POSSIBLY_CREATE = 0,
//   NEVER_CREATE = 1,
//   ALWAYS_CREATE = 2
// }

function field(
  length: number,
  type: number,
  name: string,
  decoder?: { [key: number]: string }
): FieldDescriptor {
  return { length, type, name, decoder };
}

const Descriptors: { [messageType: number]: FieldDescriptor[] } = {
  0x01: [
    field(1, NUMBER, 'messageType', MESSAGE_TYPES),
    field(1, NUMBER, 'more', DECODE_MORE),
    field(2, NUMBER, 'protocolVersion'),
    field(4, NUMBER, 'maxSize'),
    field(1, NUMBER, 'creationMode', DECODE_CREATION_MODE),
    field(8, NUMBER, 'offset'),
    field(1, NUMBER, 'docIDLength'),
    field(-1, STRING, 'docID'), // -1 means use previous field as length
    field(-2, STRING, 'data') // -2 means use rest of message as length
  ],
  0x02: [
    field(1, NUMBER, 'messageType', MESSAGE_TYPES),
    field(1, NUMBER, 'more', DECODE_MORE),
    field(8, NUMBER, 'offset'),
    field(-2, STRING, 'data')
  ],
  0x03: [
    // SET-KEY
    field(1, NUMBER, 'messageType', MESSAGE_TYPES),
    field(1, NUMBER, 'more', DECODE_MORE),
    field(2, NUMBER, 'requestID'),
    field(1, NUMBER, 'lifetime', DECODE_KEY_LIFETIME),
    field(4, NUMBER, 'oldVersion'),
    field(4, NUMBER, 'newVersion'),
    field(4, NUMBER, 'nameLength'),
    field(-1, STRING, 'name'),
    field(4, NUMBER, 'valueLength'),
    field(-1, STRING, 'value')
  ],
  0x04: [
    // BROADCAST
    field(1, NUMBER, 'messageType', MESSAGE_TYPES),
    field(1, NUMBER, 'more', DECODE_MORE),
    field(4, NUMBER, 'dataLength'),
    field(-1, STRING, 'data')
  ],
  0x80: [
    field(1, NUMBER, 'messageType', MESSAGE_TYPES),
    field(1, NUMBER, 'more', DECODE_MORE),
    field(2, NUMBER, 'errorCode', DECODE_ERROR),
    field(-2, STRING, 'description')
  ],
  0x81: [
    field(1, NUMBER, 'messageType', MESSAGE_TYPES),
    field(1, NUMBER, 'more', DECODE_MORE),
    field(2, NUMBER, 'ack', DECODE_ACK_NACK),
    field(8, NUMBER, 'offset')
  ],
  0x82: [
    // key information
    field(1, NUMBER, 'messageType', MESSAGE_TYPES),
    field(1, NUMBER, 'more', DECODE_MORE),
    field(0, REPEAT_TO_END, 'keys'),
    field(4, NUMBER, 'version'),
    field(4, NUMBER, 'nameLength'),
    field(-1, STRING, 'name'),
    field(4, NUMBER, 'valueLength'),
    field(-1, STRING, 'value')
  ],
  0x83: [
    // SET-KEY-ACK
    field(1, NUMBER, 'messageType', MESSAGE_TYPES),
    field(1, NUMBER, 'more', DECODE_MORE),
    field(2, NUMBER, 'ack', DECODE_ACK_NACK),
    field(2, NUMBER, 'requestID')
  ],
  0xff: [
    // used for unknown message type or continuations
    field(1, NUMBER, 'messageType', MESSAGE_TYPES),
    field(1, NUMBER, 'more', DECODE_MORE),
    field(-2, STRING, 'data')
  ]
};

interface DecodedMessage {
  type: string;
  fromServer: boolean;
  client: string;
  fields: MessageChunk[];
}

interface MessageChunk {
  raw: string;
  fieldName: string;
  decoded: string;
}

function hex(m: Uint8Array): string {
  const str = [''];
  let j = 0;
  for (let i = 0; i < m.length; i++) {
    if (++j % 8 === 0) {
      str.push('\n');
    }
    let c = m[i].toString(16);
    if (c.length < 2) {
      c = '0' + c;
    }
    str.push(c);
  }
  return str.join(' ');
}

function writeUint(m: number[], n: number, size: number): void {
  // javascript bitshift operators don't work for 64-bit values.
  do {
    size -= 1;
    m.push(Math.floor((n / Math.pow(2, size * 8)) % 256));
  } while (size > 0);
}

function writeString(m: number[], str: string): void {
  new TextEncoder().encode(str).forEach(val => m.push(val));
}

function readUint(m: number[] | Uint8Array, at: number, size: number): number {
  let ret = 0;
  while (size) {
    ret = ret * 256 + m[at];
    size -= 1;
    at += 1;
  }
  return ret;
}

function readString(m: Uint8Array, at: number, length = m.length - at): string {
  return new TextDecoder().decode(m.slice(at, at + length));
}

/**
 * Encode message encodes a message from JSON into binary format,
 * suitable for sending over a websocket. The message must have all of the fields
 * defined in the field descriptors above.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function encode(js: any): Uint8Array {
  const decoder = Descriptors[js['messageType']];
  if (!decoder) {
    throw new Error('no encoder for message type ' + js['messageType']);
  }

  const m = [];
  for (const field of decoder) {
    if (!(field.name in js)) {
      throw new Error('missing field ' + field.name);
    }
    const value = js[field.name];
    if (field.type === NUMBER) {
      writeUint(m, value, field.length);
    } else {
      writeString(m, value);
    }
  }

  return new Uint8Array(m);
}

// Decodes a message from binary format into JSON structure.
export function decode(m: Uint8Array): Message {
  const messageType = m[0];
  const decoder = Descriptors[messageType];
  if (!decoder) {
    console.log('no decoder for message type ' + m[0]);
    return null;
  }

  let js = {}; // current object we are filling out.
  const returnValue = js;
  let lastValue = 0;
  let pos = 0;
  let repeatToEndField = '';
  const repeatToEndIndex = 0; // index of decoder field
  for (let i = 0; i < decoder.length; i++) {
    const field = decoder[i];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any;
    if (field.type === REPEAT_TO_END) {
      repeatToEndField = field.name;
      js = {};
      returnValue[repeatToEndField] = [js];
    } else if (field.type === NUMBER) {
      value = lastValue = readUint(m, pos, field.length);
      pos += field.length;
    } else {
      let length = lastValue;
      if (field.length === -2) {
        length = m.length - pos;
      }
      value = readString(m, pos, length);
      pos += length;
    }
    js[field.name] = value;

    // if there is more message left and we are reading repeat-to-end, then
    // skip backwards.
    if (pos < m.length && i + 1 == decoder.length && repeatToEndField.length) {
      js = {};
      returnValue[repeatToEndField].push(js);
      i = repeatToEndIndex;
    }
  }
  return returnValue;
}

// Decodes a message into a more detailed format used for testing / debugging.
export function decodeAdvanced(
  m: Uint8Array,
  client: string,
  fromServer: boolean
): DecodedMessage {
  const dec: DecodedMessage = {
    type: 'unknown',
    client: client,
    fromServer: fromServer,
    fields: []
  };

  const type = m[0];
  let descriptors = Descriptors[type];
  if (!descriptors) {
    descriptors = Descriptors[0xff];
  }

  let lastValue = 0;
  let pos = 0;
  let repeatToEndIndex = 0;
  for (let i = 0; i < descriptors.length; i++) {
    const field = descriptors[i];
    if (pos >= m.length) {
      break;
    }

    if (field.type === REPEAT_TO_END) {
      repeatToEndIndex = i;
    } else if (field.type == NUMBER) {
      let value = 0;
      lastValue = value = readUint(m, pos, field.length);
      dec.fields.push({
        raw: hex(m.slice(pos, pos + field.length)),
        fieldName: field.name,
        decoded: `${field.decoder ? field.decoder[value] : value}`
      });
      pos += field.length;
    } else {
      // string
      let value = '';
      let length = field.length;
      if (field.length == -1) {
        length = lastValue;
      } else {
        length = m.length - pos;
      }
      value = readString(m, pos, length);
      dec.fields.push({
        raw: hex(m.slice(pos, pos + length)),
        fieldName: field.name,
        decoded: `"${value}"`
      });
      pos += length;
    }

    if (i + 1 === descriptors.length && pos < m.length && repeatToEndIndex) {
      i = repeatToEndIndex;
    }
  }

  return dec;
}
