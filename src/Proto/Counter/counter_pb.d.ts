// package: count
// file: counter.proto

import * as jspb from "google-protobuf";

export class Empty extends jspb.Message {
    serializeBinary(): Uint8Array;

    toObject(includeInstance?: boolean): Empty.AsObject;

    static toObject(includeInstance: boolean, msg: Empty): Empty.AsObject;

    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };

    static serializeBinaryToWriter(message: Empty, writer: jspb.BinaryWriter): void;

    static deserializeBinary(bytes: Uint8Array): Empty;

    static deserializeBinaryFromReader(message: Empty, reader: jspb.BinaryReader): Empty;
}

export namespace Empty {
    export type AsObject = {}
}

export class CounterRequest extends jspb.Message {
    getCount(): number;

    setCount(value: number): void;

    serializeBinary(): Uint8Array;

    toObject(includeInstance?: boolean): CounterRequest.AsObject;

    static toObject(includeInstance: boolean, msg: CounterRequest): CounterRequest.AsObject;

    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };

    static serializeBinaryToWriter(message: CounterRequest, writer: jspb.BinaryWriter): void;

    static deserializeBinary(bytes: Uint8Array): CounterRequest;

    static deserializeBinaryFromReader(message: CounterRequest, reader: jspb.BinaryReader): CounterRequest;
}

export namespace CounterRequest {
    export type AsObject = {
        count: number,
    }
}

export class CounterReply extends jspb.Message {
    getCurcounter(): number;

    setCurcounter(value: number): void;

    serializeBinary(): Uint8Array;

    toObject(includeInstance?: boolean): CounterReply.AsObject;

    static toObject(includeInstance: boolean, msg: CounterReply): CounterReply.AsObject;

    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };

    static serializeBinaryToWriter(message: CounterReply, writer: jspb.BinaryWriter): void;

    static deserializeBinary(bytes: Uint8Array): CounterReply;

    static deserializeBinaryFromReader(message: CounterReply, reader: jspb.BinaryReader): CounterReply;
}

export namespace CounterReply {
    export type AsObject = {
        curcounter: number,
    }
}
