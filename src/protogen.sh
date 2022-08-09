PS D:\Playground\my-grpc-ts-proj> protoc --plugin=protoc-gen-ts=D:\Playground\my-grpc-ts-proj\node_modules\.bin\protoc-gen-ts.cmd --js_out=import_style=commonjs,binary:. --ts_out=. counter.proto





PS D:\Playground\my-grpc-ts-proj> protoc --plugin=protoc-gen-ts=D:\Playground\my-grpc-ts-proj\node_modules\.bin\protoc-gen-ts.cmd --js_out=import_style=commonjs,binary:. --ts_out=service=grpc-web:. counter.proto
