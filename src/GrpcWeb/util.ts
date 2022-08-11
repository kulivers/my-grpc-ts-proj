import {ProtobufMessage} from "./message";

export function frameRequest(request: ProtobufMessage): Uint8Array {
  const bytes = request.serializeBinary();
  console.log('(frameRequest) serizlized bytes: ', bytes)
  const frame = new ArrayBuffer(bytes.byteLength + 5);
  new DataView(frame, 1, 4).setUint32(0, bytes.length, false /* big endian */);
  new Uint8Array(frame, 5).set(bytes);

  return new Uint8Array(frame);
}
