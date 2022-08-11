import {Metadata} from "./metadata";
import {ChunkParser, Chunk, ChunkType} from "./ChunkParser";
import {Code, httpStatusToCode} from "./Code";
import {debug} from "./debug";
import {Transport, TransportFactory, makeDefaultTransport} from "./transports/Transport";
import {MethodDefinition} from "./service";
import {frameRequest} from "./util";
import {ProtobufMessage} from "./message";
import {IMethodDescriptorProto} from "protobufjs/ext/descriptor";
import pb from "protobufjs";

export interface RpcOptions {
    transport?: TransportFactory;
    debug?: boolean;
}

export interface ClientRpcOptions extends RpcOptions {
    host: string;
}

export interface IMethodDescriptor {
    packageName: string | null, //todo maybe we can take it from service.parent.name, but im not sure it will work ok
    service: pb.Service,
    method: pb.Method,
    requestType: pb.Type,
    responseType: pb.Type,
    requestStream: boolean;
    responseStream: boolean;
}

export interface Client {
    start(metadata?: Metadata.ConstructorArg): void;

    send(message: pb.Message): void;

    finishSend(): void;

    close(): void;

    onHeaders(callback: (headers: Metadata) => void): void;

    onMessage(callback: (message: {}) => void): void;

    onEnd(callback: (code: Code, message: string, trailers: Metadata) => void): void;
}


//todo my methodDescriptor
export function client(methodDescriptor: IMethodDescriptor, props: ClientRpcOptions): Client {
    return new GrpcClient(methodDescriptor, props);
}

class GrpcClient {
    methodDefinition: IMethodDescriptor;
    props: ClientRpcOptions;

    started: boolean = false;
    sentFirstMessage: boolean = false;
    completed: boolean = false;
    closed: boolean = false;
    finishedSending: boolean = false;

    onHeadersCallbacks: Array<(headers: Metadata) => void> = [];
    onMessageCallbacks: Array<(res: {}) => void> = [];
    onEndCallbacks: Array<(code: Code, message: string, trailers: Metadata) => void> = [];
    transport: Transport;
    parser = new ChunkParser();
    responseHeaders: Metadata;
    responseTrailers: Metadata;

    constructor(methodDescriptor: IMethodDescriptor, props: ClientRpcOptions) {
        this.methodDefinition = methodDescriptor;
        this.props = props;

        this.createTransport();
    }

    createTransport() {
        const packageName: string = this.methodDefinition.packageName === null ? '' : (`${this.methodDefinition.packageName}.`)
        const url = `${this.props.host}/${packageName}${this.methodDefinition.service.name}/${this.methodDefinition.method.name}`;
        const transportOptions = {
            methodDefinition: this.methodDefinition,
            debug: this.props.debug || false,
            url: url,
            onHeaders: this.onTransportHeaders.bind(this),
            onChunk: this.onTransportChunk.bind(this),
            onEnd: this.onTransportEnd.bind(this),
        };

        if (this.props.transport) {
            this.transport = this.props.transport(transportOptions);
        } else {
            this.transport = makeDefaultTransport(transportOptions);
        }
    }

    onTransportHeaders(headers: Metadata, status: number) {
        this.props.debug && debug("onHeaders", headers, status);
        if (this.closed) {
            this.props.debug && debug("grpc.onHeaders received after request was closed - ignoring");
            return;
        }
        if (status === 0) {
            // The request has failed due to connectivity issues. Do not capture the headers
        } else {
            this.responseHeaders = headers;
            this.props.debug && debug("onHeaders.responseHeaders", JSON.stringify(this.responseHeaders, null, 2));

            const gRPCStatus = getStatusFromHeaders(headers);
            this.props.debug && debug("onHeaders.gRPCStatus", gRPCStatus);

            const code = gRPCStatus && gRPCStatus >= 0 ? gRPCStatus : httpStatusToCode(status);
            this.props.debug && debug("onHeaders.code", code);

            const gRPCMessage = headers.get("grpc-message") || [];
            this.props.debug && debug("onHeaders.gRPCMessage", gRPCMessage);

            this.rawOnHeaders(headers);

            if (code !== Code.OK) {
                const statusMessage = this.decodeGRPCStatus(gRPCMessage[0]);
                this.rawOnError(code, statusMessage, headers);
            }
        }
    }

    onTransportChunk(chunkBytes: Uint8Array) {
        this.props.debug && debug("data from chunks", ('in onTransportChunk, here is bytes from respose: ' + chunkBytes));
        if (this.closed) {
            this.props.debug && debug("grpc.onChunk received after request was closed - ignoring");
            return;
        }
        let data: Chunk[] = [];
        try {
            data = this.parser.parse(chunkBytes);
            this.props.debug && debug("data from chunks", data);

        } catch (e) {
            this.props.debug && debug("onChunk.parsing error", e, e.message);
            this.rawOnError(Code.Internal, `parsing error: ${e.message}`);
            return;
        }
        this.props.debug && debug("now we will go foreach chunk");
        data.forEach((d: Chunk) => {
            this.props.debug && debug('chunk: ', d);
            if (d.chunkType === ChunkType.MESSAGE) {
                const deserialized = this.methodDefinition.responseType.decode(d.data!);

                this.props.debug && debug('we deserialise by methodDefinition.responseType.deserializeBinary', deserialized)
                this.rawOnMessage(deserialized);
            } else if (d.chunkType === ChunkType.TRAILERS) {
                if (!this.responseHeaders) {
                    this.responseHeaders = new Metadata(d.trailers);
                    this.rawOnHeaders(this.responseHeaders);
                } else {
                    this.responseTrailers = new Metadata(d.trailers);
                    this.props.debug && debug("onChunk.trailers", this.responseTrailers);
                }
            }
        });
    }

    onTransportEnd() {

        this.props.debug && debug("grpc.onEnd");

        if (this.closed) {
            this.props.debug && debug("grpc.onEnd received after request was closed - ignoring");
            return;
        }
        if (this.responseTrailers === undefined) {
            if (this.responseHeaders === undefined) {
                // The request was unsuccessful - it did not receive any headers
                this.rawOnError(Code.Unknown, "Response closed without headers");
                return;
            }

            const grpcStatus = getStatusFromHeaders(this.responseHeaders);
            const grpcMessage = this.responseHeaders.get("grpc-message");

            // This was a headers/trailers-only response
            this.props.debug && debug("grpc.headers only response ", grpcStatus, grpcMessage);

            if (grpcStatus === null) {
                this.rawOnEnd(Code.Unknown, "Response closed without grpc-status (Headers only)", this.responseHeaders);
                return;
            }

            // Return an empty trailers instance
            const statusMessage = this.decodeGRPCStatus(grpcMessage[0]);
            this.rawOnEnd(grpcStatus, statusMessage, this.responseHeaders);
            return;
        }

        // There were trailers - get the status from them
        const grpcStatus = getStatusFromHeaders(this.responseTrailers);
        if (grpcStatus === null) {
            this.rawOnError(Code.Internal, "Response closed without grpc-status (Trailers provided)");
            return;
        }

        const grpcMessage = this.responseTrailers.get("grpc-message");
        const statusMessage = this.decodeGRPCStatus(grpcMessage[0]);
        this.rawOnEnd(grpcStatus, statusMessage, this.responseTrailers);
    }

    decodeGRPCStatus(src: string | undefined): string {
        if (src) {
            try {
                return decodeURIComponent(src)
            } catch (err) {
                return src
            }
        } else {
            return ""
        }
    }

    rawOnEnd(code: Code, message: string, trailers: Metadata) {
        this.props.debug && debug("rawOnEnd", code, message, trailers);
        if (this.completed) return;
        this.completed = true;

        this.onEndCallbacks.forEach(callback => {
            if (this.closed) return;
            try {
                callback(code, message, trailers);
            } catch (e) {
                setTimeout(() => {
                    throw e;
                }, 0);
            }
        });
    }

    rawOnHeaders(headers: Metadata) {
        this.props.debug && debug("rawOnHeaders", headers);
        if (this.completed) return;
        this.onHeadersCallbacks.forEach(callback => {
            try {
                callback(headers);
            } catch (e) {
                setTimeout(() => {
                    throw e;
                }, 0);
            }
        });
    }

    rawOnError(code: Code, msg: string, trailers: Metadata = new Metadata()) {
        this.props.debug && debug("rawOnError", code, msg);
        if (this.completed) return;
        this.completed = true;
        this.onEndCallbacks.forEach(callback => {
            if (this.closed) return;
            try {
                callback(code, msg, trailers);
            } catch (e) {
                setTimeout(() => {
                    throw e;
                }, 0);
            }
        });
    }

    rawOnMessage(res: {}) {
        this.props.debug && debug("rawOnMessage", res);
        if (this.completed || this.closed) return;
        this.onMessageCallbacks.forEach(callback => {
            if (this.closed) return;
            try {
                callback(res);
            } catch (e) {
                setTimeout(() => {
                    throw e;
                }, 0);
            }
        });
    }

    onHeaders(callback: (headers: Metadata) => void) {
        this.onHeadersCallbacks.push(callback);
    }

    onMessage(callback: (res: {}) => void) {
        this.onMessageCallbacks.push(callback);
    }

    onEnd(callback: (code: Code, message: string, trailers: Metadata) => void) {
        this.onEndCallbacks.push(callback);
    }

    start(metadata?: Metadata.ConstructorArg) {
        if (this.started) {
            throw new Error("Client already started - cannot .start()");
        }
        this.started = true;

        const requestHeaders = new Metadata(metadata ? metadata : {});
        requestHeaders.set("content-type", "application/grpc-web+proto");
        requestHeaders.set("x-grpc-web", "1"); // Required for CORS handling

        this.transport.start(requestHeaders);
    }

    send(requestMessage: pb.Message) {
        if (!this.started) {
            throw new Error("Client not started - .start() must be called before .send()");
        }
        if (this.closed) {
            throw new Error("Client already closed - cannot .send()");
        }
        if (this.finishedSending) {
            throw new Error("Client already finished sending - cannot .send()");
        }
        if (!this.methodDefinition.requestStream && this.sentFirstMessage) {
            // This is a unary method and the first and only message has been sent
            throw new Error("Message already sent for non-client-streaming method - cannot .send()");
        }
        this.sentFirstMessage = true;
        this.props.debug && debug('(client.send) we send message, it is ', requestMessage)
        let requestBytes = this.methodDefinition.requestType.encode(requestMessage).finish()
        const msgBytes = frameRequest(requestBytes);
        this.props.debug && debug('(client.send) we made bytes from it, now it is ', msgBytes)
        this.transport.sendMessage(msgBytes);
    }

    finishSend() {
        if (!this.started) {
            throw new Error("Client not started - .finishSend() must be called before .close()");
        }
        if (this.closed) {
            throw new Error("Client already closed - cannot .send()");
        }
        if (this.finishedSending) {
            throw new Error("Client already finished sending - cannot .finishSend()");
        }
        this.finishedSending = true;
        this.transport.finishSend();
    }

    close() {
        if (!this.started) {
            throw new Error("Client not started - .start() must be called before .close()");
        }
        if (!this.closed) {
            this.closed = true;
            this.props.debug && debug("request.abort aborting request");
            this.transport.cancel();
        } else {
            throw new Error("Client already closed - cannot .close()");
        }
    }
}

function getStatusFromHeaders(headers: Metadata): Code | null {
    const fromHeaders = headers.get("grpc-status") || [];
    if (fromHeaders.length > 0) {
        try {
            const asString = fromHeaders[0];
            return parseInt(asString, 10);
        } catch (e) {
            return null;
        }
    }
    return null;
}
