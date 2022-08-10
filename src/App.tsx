import React, {useEffect, useState} from 'react';
import pb, {Message} from 'protobufjs'
import {grpc} from "./GrpcWeb/index";
import counter_pb, {CounterReply, Empty} from './Proto/Counter/counter_pb'
import {Counter} from './Proto/Counter/counter_pb_service'
import counterJson from './Proto/Counter/counter.json'
import {ServiceDefinition, UnaryMethodDefinition} from "./GrpcWeb/service";
import {ProtobufMessage, ProtobufMessageClass} from "./GrpcWeb/message";
import {UnaryRpcOptions} from "./GrpcWeb/unary";
import * as jspb from "google-protobuf";
import {grpc as myGrpc}  from './MyGrpcWeb'
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
        var empty = countNS.lookupType('Empty')


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
            <br/>
            <button onClick={() => {
                makeStableUnaryCall()
            }}>make Stable Unary Call
            </button>
            <br/>
            <button onClick={() => {
                makeMyUnaryCall()
            }}>make My Unary Call
            </button>
        </div>
    );
}

export default App;




