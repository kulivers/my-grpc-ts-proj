import React, {useEffect} from 'react';
import pb, {Message} from 'protobufjs'
import {grpc} from "./GrpcWeb/index";
import counter_pb, {CounterReply, Empty} from './Proto/Counter/counter_pb'
import {Counter} from './Proto/Counter/counter_pb_service'
import counterJson from './Proto/Counter/counter.json'
import {ServiceDefinition, UnaryMethodDefinition} from "./GrpcWeb/service";
import {ProtobufMessage, ProtobufMessageClass} from "./GrpcWeb/message";
import {UnaryRpcOptions} from "./GrpcWeb/unary";


const host = 'https://localhost:7064'

function App() {
    useEffect(() => {
        const proto = require('./Proto/Counter/counter.proto')
        let root: pb.Root | undefined;
        pb.load(proto, (error, r) => {
            root = r;
        })
        var empty = new Empty()

        grpc.unary(Counter.GetCounter, {
            request: empty,
            host: host,
            onEnd: res => {
                console.log('response: ', res.message)
                // const { status, statusMessage, headers, message, trailers } = res;
                // if (status === grpc.Code.OK ) {
                //     console.log("all ok. got book: ");
                // }

            }
        })


    }, [])
    return (
        <div className="App"
             style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <h1>im not dead bro</h1>
            <button onClick={() => {
                var emptyGen = new Empty();


                let countNS = pb.Namespace.fromJSON('count', counterJson);
                var counterService = countNS.lookupService('Counter')

                var counterReply = countNS.lookupType('CounterReply')
                var message = {curCounter: 20}
                var isOk = counterReply.verify(message)
                var encodedMessage = counterReply.encode(message).finish()


                var mockMethodDescriptor = new MockMethodDescriptor();
                grpc.unary(mockMethodDescriptor, {
                        request: emptyGen,
                        host: host,
                        onEnd: res => {
                            console.log('response: ', res.message)

                        }
                    }
                )


            }}>fast debug button
            </button>
        </div>
    );
}


class MockEmptyMessage implements ProtobufMessage {
    serializeBinary(): Uint8Array {
        return this.empty.encode({}).finish()
    }

    toObject(): {} {
        return {};
    }

    constructor() {
        this.empty = pb.Namespace.fromJSON('count', counterJson).lookupType('Empty')
    }

    empty: pb.Type
}

// @ts-ignore todo check strange interface
class MockRequest implements ProtobufMessageClass<MockEmptyMessage> {
    empty: pb.Type
    constructor() {
        this.empty = pb.Namespace.fromJSON('count', counterJson).lookupType('Empty')
    }

    MockEmptyMessage()
    {
        return new MockEmptyMessage();
    }
    deserializeBinary(bytes: Uint8Array): MockEmptyMessage {
        return new MockEmptyMessage()
    }


}

class MockServiceForMDef implements ServiceDefinition {
    serviceName: string;
    constructor() {
        this.serviceName = 'count.Counter'
    }
}

class MockMethodDescriptor implements UnaryMethodDefinition<ProtobufMessage, ProtobufMessage> {
    constructor() {
        this.methodName = "GetCounter";
        this.service = new MockServiceForMDef();
        this.requestStream = false;
        this.responseStream = false;
        this.requestType = new MockRequest();        //: ProtobufMessageClass<TRequest>;
        this.responseType = counter_pb.CounterReply;//: ProtobufMessageClass<TResponse>;
    }

    methodName: string;
    requestStream: false;
    requestType: ProtobufMessageClass<MockEmptyMessage>;
    responseStream: false;
    responseType: ProtobufMessageClass<ProtobufMessage>;
    service: ServiceDefinition;
}

export default App;




