import {Metadata} from "../../metadata";
import {Transport, TransportFactory, TransportOptions} from "../Transport";
import {debug} from "../../debug";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type FetchTransportInit = Omit<RequestInit, "headers" | "method" | "body" | "signal">;

export function FetchReadableStreamTransport(init: FetchTransportInit): TransportFactory {
    return (opts: TransportOptions) => {
        return fetchRequest(opts, init);
    }
}

function fetchRequest(options: TransportOptions, init: FetchTransportInit): Transport {
    options.debug && debug("fetchRequest", options);

    return new Fetch(options, init);
}

declare const Response: any;
declare const Headers: any;

class Fetch implements Transport {
    cancelled: boolean = false;
    options: TransportOptions;
    init: FetchTransportInit;
    // reader: ReadableStreamReader;
    reader: ReadableStreamReader<any>;
    metadata: Metadata;

    // controller: AbortController | undefined = (self as any).AbortController && new AbortController(); todo
    controller: AbortController | undefined = (window.self as any).AbortController && new AbortController();

    constructor(transportOptions: TransportOptions, init: FetchTransportInit) {
        this.options = transportOptions;
        this.init = init;
    }

    // pump(readerArg: ReadableStreamReader, res: Response) { todo
    pump(readerArg: ReadableStreamReader<any>, res: Response) {
        this.reader = readerArg;

        if (this.cancelled) {
            // If the request was cancelled before the first pump then cancel it here
            this.options.debug && debug("Fetch.pump.cancel at first pump");
            this.reader.cancel().catch(e => {
                // This can be ignored. It will likely throw an exception due to the request being aborted
                this.options.debug && debug("Fetch.pump.reader.cancel exception", e);
            });
            return;
        }
        this.reader.read()
            .then((result) => {
                if (result.done) {
                    this.options.onEnd();
                    return res;
                }
                this.options.debug && debug('(fetch.pump) im going onChunk from client')
                this.options.onChunk(result.value);

                this.pump(this.reader, res);
                return;
            })
            .catch(err => {
                if (this.cancelled) {
                    this.options.debug && debug("Fetch.catch - request cancelled");
                    return;
                }
                this.cancelled = true;
                this.options.debug && debug("Fetch.catch", err.message);
                this.options.onEnd(err);
            });
    }

    send(msgBytes: Uint8Array) {
        this.options.debug && debug('(fetch.send) we fetch headers: ', this.metadata.toHeaders())
        this.options.debug && debug('(fetch.send) we fetch body: ', msgBytes)
        fetch(this.options.url, {
            ...this.init,
            headers: this.metadata.toHeaders(),
            method: "POST",
            body: msgBytes,
            signal: this.controller && this.controller.signal,
        }).then((res: Response) => {
            this.options.debug && debug('(fetch.send) we got response: ', res)
            this.options.onHeaders(new Metadata(res.headers as any), res.status);
            if (res.body) {
                this.pump(res.body.getReader(), res)
                return;
            }
            return res;
        }).catch(err => {
            if (this.cancelled) {
                this.options.debug && debug("Fetch.catch - request cancelled");
                return;
            }
            this.cancelled = true;
            this.options.debug && debug("Fetch.catch", err.message);
            this.options.onEnd(err);
        });
    }

    sendMessage(msgBytes: Uint8Array) {
        this.options.debug && debug('bytes to send of Fetch method')
        this.send(msgBytes);
    }

    finishSend() {

    }

    start(metadata: Metadata) {
        this.metadata = metadata;
    }

    cancel() {
        if (this.cancelled) {
            this.options.debug && debug("Fetch.cancel already cancelled");
            return;
        }
        this.cancelled = true;

        if (this.controller) {
            this.options.debug && debug("Fetch.cancel.controller.abort");
            this.controller.abort();
        } else {
            this.options.debug && debug("Fetch.cancel.missing abort controller");
        }

        if (this.reader) {
            // If the reader has already been received in the pump then it can be cancelled immediately
            this.options.debug && debug("Fetch.cancel.reader.cancel");
            this.reader.cancel().catch(e => {
                // This can be ignored. It will likely throw an exception due to the request being aborted
                this.options.debug && debug("Fetch.cancel.reader.cancel exception", e);
            });
        } else {
            this.options.debug && debug("Fetch.cancel before reader");
        }
    }
}

export function detectFetchSupport(): boolean {
    return typeof Response !== "undefined" && Response.prototype.hasOwnProperty("body") && typeof Headers === "function";
}
