import pb, {Message} from 'protobufjs'
import {Metadata} from "./metadata";
import {frameRequest} from "./util";
import {Fetch} from "./fetch";
import {ClientRpcOptions} from "./clientRpcOptions";




export class GrpcClient {
    fetchRequest: Fetch;
    options: ClientRpcOptions;
    service: pb.Service;
    messageType: pb.Type;
    method: string;
    message: (Message<{}> | { [k: string]: any })

    public constructor(host: string, service: pb.Service, method: string, messageType: pb.Type, options: ClientRpcOptions) {
        this.service = service;
        this.messageType = messageType;
        this.options = options;
        this.method = method;
        // this.checkMethodIsAvailible(this.method) todo uncomment
        let url = `${host}/${service.name}/${method}`;
        url = 'https://localhost:7064/count.Counter/GetCounter'
        this.fetchRequest = new Fetch({debug: false,
            url:url,
            onEnd:options.onEnd,
            onChunk: chunkBytes => {
                console.log('in grpcClient ctor onChunk: ', chunkBytes)
            }
        })
    }


    public unary(message: (Message<{}> | { [k: string]: any }),) {
        let responseHeaders: Metadata | null = null;
        var bytes = this.messageType.encode(message).finish()
        const msgBytes = frameRequest(bytes);
        this.fetchRequest.send(msgBytes)
    }


    checkMethodIsAvailible(methodName: string) {
        var isThere = false;
        for (var i = 0; i < this.service.methodsArray.length; i++) {
            if (this.service.methodsArray[i].name === methodName)
                isThere = true;
        }
        if (!isThere)
            throw new Error(`No method ${methodName} in service ${this.service.name}`)
    }

}

//@ts-ignore