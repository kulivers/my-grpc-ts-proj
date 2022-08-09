// package: count
// file: counter.proto

import * as counter_pb from "./counter_pb";
import {grpc} from "@improbable-eng/grpc-web";

type CounterGetCounter = {
  readonly methodName: string;
  readonly service: typeof Counter;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof counter_pb.Empty;
  readonly responseType: typeof counter_pb.CounterReply;
};

type CounterIncrement = {
  readonly methodName: string;
  readonly service: typeof Counter;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof counter_pb.Empty;
  readonly responseType: typeof counter_pb.CounterReply;
};

type CounterSetCounter = {
  readonly methodName: string;
  readonly service: typeof Counter;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof counter_pb.CounterRequest;
  readonly responseType: typeof counter_pb.Empty;
};

type CounterAccumulateCount = {
  readonly methodName: string;
  readonly service: typeof Counter;
  readonly requestStream: true;
  readonly responseStream: false;
  readonly requestType: typeof counter_pb.CounterRequest;
  readonly responseType: typeof counter_pb.CounterReply;
};

type CounterCountdown = {
  readonly methodName: string;
  readonly service: typeof Counter;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof counter_pb.Empty;
  readonly responseType: typeof counter_pb.CounterReply;
};

export class Counter {
  static readonly serviceName: string;
  static readonly GetCounter: CounterGetCounter;
  static readonly Increment: CounterIncrement;
  static readonly SetCounter: CounterSetCounter;
  static readonly AccumulateCount: CounterAccumulateCount;
  static readonly Countdown: CounterCountdown;
}

export type ServiceError = { message: string, code: number; metadata: grpc.Metadata }
export type Status = { details: string, code: number; metadata: grpc.Metadata }

interface UnaryResponse {
  cancel(): void;
}
interface ResponseStream<T> {
  cancel(): void;
  on(type: 'data', handler: (message: T) => void): ResponseStream<T>;
  on(type: 'end', handler: (status?: Status) => void): ResponseStream<T>;
  on(type: 'status', handler: (status: Status) => void): ResponseStream<T>;
}
interface RequestStream<T> {
  write(message: T): RequestStream<T>;
  end(): void;
  cancel(): void;
  on(type: 'end', handler: (status?: Status) => void): RequestStream<T>;
  on(type: 'status', handler: (status: Status) => void): RequestStream<T>;
}
interface BidirectionalStream<ReqT, ResT> {
  write(message: ReqT): BidirectionalStream<ReqT, ResT>;
  end(): void;
  cancel(): void;
  on(type: 'data', handler: (message: ResT) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'end', handler: (status?: Status) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'status', handler: (status: Status) => void): BidirectionalStream<ReqT, ResT>;
}

export class CounterClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  getCounter(
    requestMessage: counter_pb.Empty,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: counter_pb.CounterReply|null) => void
  ): UnaryResponse;
  getCounter(
    requestMessage: counter_pb.Empty,
    callback: (error: ServiceError|null, responseMessage: counter_pb.CounterReply|null) => void
  ): UnaryResponse;
  increment(
    requestMessage: counter_pb.Empty,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: counter_pb.CounterReply|null) => void
  ): UnaryResponse;
  increment(
    requestMessage: counter_pb.Empty,
    callback: (error: ServiceError|null, responseMessage: counter_pb.CounterReply|null) => void
  ): UnaryResponse;
  setCounter(
    requestMessage: counter_pb.CounterRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: counter_pb.Empty|null) => void
  ): UnaryResponse;
  setCounter(
    requestMessage: counter_pb.CounterRequest,
    callback: (error: ServiceError|null, responseMessage: counter_pb.Empty|null) => void
  ): UnaryResponse;
  accumulateCount(metadata?: grpc.Metadata): RequestStream<counter_pb.CounterRequest>;
  countdown(requestMessage: counter_pb.Empty, metadata?: grpc.Metadata): ResponseStream<counter_pb.CounterReply>;
}

