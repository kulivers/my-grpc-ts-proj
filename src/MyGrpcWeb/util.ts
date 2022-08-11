export function frameRequest(requestBytes: Uint8Array): Uint8Array {
  const frame = new ArrayBuffer(requestBytes.byteLength + 5);
  new DataView(frame, 1, 4).setUint32(0, requestBytes.length, false /* big endian */);
  new Uint8Array(frame, 5).set(requestBytes);
  return new Uint8Array(frame);
}
