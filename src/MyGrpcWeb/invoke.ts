import {Code} from "./Code";
import {Metadata} from "./metadata";
import {client, IMethodDescriptor, RpcOptions} from "./client";
import pb from "protobufjs";

export interface Request {
  close: () => void;
}

export interface InvokeRpcOptions extends RpcOptions {
  host: string;
  request: pb.Message;
  metadata?: Metadata.ConstructorArg;
  onHeaders?: (headers: Metadata) => void;
  onMessage?: (message: {}) =>void;
  onEnd: (code: Code, message: string, trailers: Metadata) => void;
}


export function invoke(methodDescriptor: IMethodDescriptor, props: InvokeRpcOptions): Request {
  if (methodDescriptor.requestStream) {
    throw new Error(".invoke cannot be used with client-streaming methods. Use .client instead.");
  }

  // client can throw an error if the transport factory returns an error (e.g. no valid transport)
  const grpcClient = client(methodDescriptor, {
    host: props.host,
    transport: props.transport,
    debug: props.debug,
  });

  if (props.onHeaders) {
    grpcClient.onHeaders(props.onHeaders);
  }
  if (props.onMessage) {
    grpcClient.onMessage(props.onMessage);
  }

  if (props.onEnd) {
    grpcClient.onEnd(props.onEnd);
  }

  grpcClient.start(props.metadata);
  grpcClient.send(props.request);
  grpcClient.finishSend();

  return {
    close: () => {
      grpcClient.close();
    }
  };
}
