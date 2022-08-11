import React, {useEffect, useState} from 'react';
import pb, {Message} from 'protobufjs'
import {grpc as mygrpc} from "./MyGrpcWeb/index";
import {grpc} from "./GrpcWeb/index";
import counter_pb, {CounterReply, Empty} from './Proto/Counter/counter_pb'
import {Counter} from './Proto/Counter/counter_pb_service'
import counterJson from './Proto/Counter/counter.json'
import {ServiceDefinition, UnaryMethodDefinition} from "./GrpcWeb/service";
import {ProtobufMessage, ProtobufMessageClass} from "./GrpcWeb/message";
import {UnaryRpcOptions} from "./GrpcWeb/unary";
import * as jspb from "google-protobuf";
import {IMethodDescriptor} from "./MyGrpcWeb/client";


const host = 'https://localhost:7064'

function App() {
    const [toDebug, setToDebug] = useState(false);

    useEffect(() => {
        console.clear()
    }, [])

    function makeStableUnaryCall() {
        const proto = require('./Proto/Counter/counter.proto')
        let root: pb.Root | undefined;
        pb.load(proto, (error, r) => {
            root = r;
        })
        var empty = new Empty()

        grpc.unary(Counter.GetCounter, {
            debug: toDebug,
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
    }

    function makeMyUnaryCall() {
        let countNS = pb.Namespace.fromJSON('count', counterJson);
        var counterService = countNS.lookupService('Counter')
        var getCounterMethod = counterService.methodsArray.find(m=>m.name==="GetCounter") as pb.Method
        var empty = countNS.lookupType('Empty')
        var counterReply = countNS.lookupType('CounterReply')

        var methodDescriptor: IMethodDescriptor = {
            method: getCounterMethod,
            requestType: empty,
            responseType: counterReply,
            service: counterService,
            packageName: countNS.name,
            requestStream: false,
            responseStream: false
        }
        var message: pb.Message = {
            $type: empty, toJSON(): { [p: string]: any } {
                return {}
            }
        }
        var rpcOptions: mygrpc.UnaryRpcOptions = {
            host: 'https://localhost:7064',
            onEnd: output => console.log(output.message),
            debug: false,
        }
        mygrpc.unary(methodDescriptor, message, rpcOptions)
    }


    function makeMySetCounter() {
        let countNS = pb.Namespace.fromJSON('count', counterJson);
        var counterService = countNS.lookupService('Counter')
        var getCounterMethod = counterService.methodsArray.find(m=>m.name==="SetCounter") as pb.Method
        var counterRequest = countNS.lookupType('CounterRequest')
        var empty = countNS.lookupType('Empty')

        var methodDescriptor: IMethodDescriptor = {
            method: getCounterMethod,
            requestType: counterRequest,
            responseType: empty,
            service: counterService,
            packageName: countNS.name,
            requestStream: false,
            responseStream: false
        }
        var message = new pb.Message({count: 1111})


        var rpcOptions: mygrpc.UnaryRpcOptions = {
            host: 'https://localhost:7064',
            onEnd: output => console.log(output.message),
            debug: false,
        }
        mygrpc.unary(methodDescriptor, message, rpcOptions)
    }

    function makeMyStreamRequest() {
        //  rpc Countdown (Empty) returns (stream CounterReply);
        let countNS = pb.Namespace.fromJSON('count', counterJson);
        var counterService = countNS.lookupService('Counter')
        var getCounterMethod = counterService.methodsArray.find(m=>m.name==="Countdown") as pb.Method
        var CounterReply = countNS.lookupType('CounterReply')
        var empty = countNS.lookupType('Empty')

        var methodDescriptor: IMethodDescriptor = {
            method: getCounterMethod,
            requestType: empty,
            responseType: CounterReply,
            service: counterService,
            packageName: countNS.name,
            requestStream: false,
            responseStream: false
        }
        var message = new pb.Message({})


        var rpcOptions: mygrpc.UnaryRpcOptions = {
            host: 'https://localhost:7064',
            onEnd: output => console.log(output.message),
            debug: false,
        }
    }

    return (
        <div className="App"
             style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <h1>im not dead bro</h1>
            <h1>debug: {toDebug === true ? 'true' : 'false'}</h1>
            <button onClick={() => {
                setToDebug(!toDebug)
            }}>toggle debug
            </button>
            <button onClick={() => {
                makeStableUnaryCall()
            }}> Lib Get Counter
            </button>
            <button onClick={() => {
                makeMyUnaryCall()
            }}> My  Get Counter
            </button>
            <button onClick={() => {
                makeMySetCounter()
            }}> My  Set Counter
            </button>


            <button onClick={() => {
                makeMyStreamRequest()
            }}> My stream request
            </button>
            <button onClick={() => {
                let countNS = pb.Namespace.fromJSON('count', counterJson);
                var counterService = countNS.lookupService('Counter')
                var empty = countNS.lookupType('Empty')
                var counterReply = countNS.lookupType('CounterReply')
                var data = new Uint8Array([8, 25])
                var message = counterReply.decode(data)
                console.log(message)
            }}>lil debug but
            </button>

        </div>
    );
}

export default App;




