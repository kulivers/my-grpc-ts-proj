import React, {useEffect, useState} from 'react';
import pb from 'protobufjs'
import {grpc} from "./GrpcWeb/index";
import {Empty, CounterReply, CounterRequest} from './Proto/Counter/counter_pb'
import {Counter} from './Proto/Counter/counter_pb_service'

// declare const USE_TLS: boolean;
// let host = USE_TLS ? "https://localhost:9091" : "http://localhost:9090";
const host = 'https://localhost:7064'


function App() {
    const [counter, setCounter] = useState(0);
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
                console.log(res)
                // const { status, statusMessage, headers, message, trailers } = res;
                // if (status === grpc.Code.OK ) {
                //     console.log("all ok. got book: ");
                // }

            }
        })

    }, [])
    return (
        <div className="App" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems:'center'} }>
            <h1>im not dead bro</h1>
            <button onClick={() => { console.log(new Empty()) }}>fast debug button</button>
        </div>
    );
}

export default App;
