import {Metadata} from "./metadata";
import {Code} from "./Code";
import {UnaryMethodDefinition} from "./service";
import {Request} from "./invoke";
import {client, IMethodDescriptor, RpcOptions} from "./client";
import {ProtobufMessage} from "./message";
import {IMethodDescriptorProto} from "protobufjs/ext/descriptor";
import pb from "protobufjs";

export interface UnaryOutput {
    status: Code;
    statusMessage: string;
    headers: Metadata;
    message: {} | null;
    trailers: Metadata;
}

export interface UnaryRpcOptions extends RpcOptions {
    host: string;
    requestObject: {};
    metadata?: Metadata.ConstructorArg;
    onEnd: (output: UnaryOutput) => void;
}

export function unary(methodDescriptor: IMethodDescriptor, message: pb.Message, props: UnaryRpcOptions): Request
{
    if (methodDescriptor.responseStream) {
        throw new Error(".unary cannot be used with server-streaming methods. Use .invoke or .client instead.");
    }
    if (methodDescriptor.requestStream) {
        throw new Error(".unary cannot be used with client-streaming methods. Use .client instead.");
    }
    let responseHeaders: Metadata | null = null;
    let responseMessage: {} | null = null;

    // client can throw an error if the transport factory returns an error (e.g. no valid transport)
    const grpcClient = client(methodDescriptor, message,{
        host: props.host,
        transport: props.transport,
        debug: props.debug,
    });
    grpcClient.onHeaders((headers: Metadata) => {
        responseHeaders = headers;
    });

    // @ts-ignore todo fix dat
    grpcClient.onMessage((res: TResponse) => {
        responseMessage = res;
    });

    grpcClient.onEnd((status: Code, statusMessage: string, trailers: Metadata) => {
        props.onEnd({
            status: status,
            statusMessage: statusMessage,
            headers: responseHeaders ? responseHeaders : new Metadata(),
            message: responseMessage,
            trailers: trailers
        });
    });

    grpcClient.start(props.metadata);
    grpcClient.send(props.requestObject);
    grpcClient.finishSend();

    return {
        close: () => {
            grpcClient.close();
        }
    };
}
