export interface ClientRpcOptions {
    host: string;
    debug: boolean;
    onEnd: (err?: Error) => void;
}