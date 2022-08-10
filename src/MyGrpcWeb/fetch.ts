import {Metadata} from "./metadata";
import {debug} from "./debug";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type FetchTransportInit = Omit<RequestInit, "headers" | "method" | "body" | "signal">;


export interface TransportOptions {
  debug: boolean;
  url: string;
  onHeaders?: (headers: Metadata, status: number) => void;
  onChunk: (chunkBytes: Uint8Array, flush?: boolean) => void;
  onEnd: (err?: Error) => void;
}

declare const Response: any;
declare const Headers: any;

export class Fetch  {
  cancelled: boolean = false;
  reader: ReadableStreamReader<any>;

  options: TransportOptions;
  metadata: Metadata;

  constructor(transportOptions: TransportOptions) {
    this.options = transportOptions;
  }

  pump(readerArg: ReadableStreamReader<any>, res: Response) {
    console.log('im in pump')
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
    fetch(this.options.url, {
      headers: this.metadata.toHeaders(), //idk
      method: "POST",
      body: msgBytes,
    }).then((res: Response) => {
      this.options.debug && debug("Fetch.response", res);
      // this.options.onHeaders(new Metadata(res.headers as any), res.status);
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
