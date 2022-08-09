import React, {useEffect, useState} from 'react';
import pb from 'protobufjs'
import {grpc} from "@improbable-eng/grpc-web";
import {BookService} from "./Proto/Fakelibrary/book_service_pb_service";
import {QueryBooksRequest, Book, GetBookRequest} from "./Proto/Fakelibrary/book_service_pb";

declare const USE_TLS: boolean;
const host = USE_TLS ? "https://localhost:9091" : "http://localhost:9090";

function queryBooks() {
    const queryBooksRequest = new QueryBooksRequest();
    queryBooksRequest.setAuthorPrefix("Geor");
    const client = grpc.client(BookService.QueryBooks, {
        host: host,
    });
    client.onHeaders((headers: grpc.Metadata) => {
        console.log("queryBooks.onHeaders", headers);
    });
    client.onMessage((message) => {
        console.log("queryBooks.onMessage", message.toObject());
    });
    client.onEnd((code: grpc.Code, msg: string, trailers: grpc.Metadata) => {
        console.log("queryBooks.onEnd", code, msg, trailers);
    });
    client.start();
    client.send(queryBooksRequest);
}

function getBook() {
    const getBookRequest = new GetBookRequest();
    getBookRequest.setIsbn(60929871);
    grpc.unary(BookService.GetBook, {
        request: getBookRequest,
        host: host,
        onEnd: res => {
            const { status, statusMessage, headers, message, trailers } = res;
            console.log("getBook.onEnd.status", status, statusMessage);
            console.log("getBook.onEnd.headers", headers);
            if (status === grpc.Code.OK && message) {
                console.log("getBook.onEnd.message", message.toObject());
            }
            console.log("getBook.onEnd.trailers", trailers);
            queryBooks();
        }
    });
}

function App() {
    const [counter, setCounter] = useState(0);
    useEffect(() => {
        const proto = require('./Proto/Counter/counter.proto')
        let root: pb.Root | undefined;
        pb.load(proto, (error, r) => {
            root = r;
        })
        getBook();

    }, [])
    return (
        <div className="App">

        </div>
    );
}

export default App;
