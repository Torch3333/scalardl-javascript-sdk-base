[![CircleCI](https://circleci.com/gh/scalar-labs/scalardl-javascript-sdk-base/tree/master.svg?style=svg)](https://circleci.com/gh/scalar-labs/scalardl-javascript-sdk-base/tree/master)

NPM package `@scalar-labs/scalardl-javascript-sdk-base` is the common part for package [@scalar-labs/scalardl-web-client-sdk](https://github.com/scalar-labs/scalardl-web-client-sdk) and [@scalar-labs/scalardl-node-client-sdk](https://github.com/scalar-labs/scalardl-node-client-sdk).
Although those two packages use different gRPC tools to generate the service and the Protobuf objects, they can use @scalar-labs/scalardl-javascript-sdk-base after they inject the objects. We will introduce how to generate related static files later in this README.

![relationship](./README.png)

The developers might not really need to use this package. Please reference [@scalar-labs/scalardl-web-client-sdk](https://github.com/scalar-labs/scalardl-web-client-sdk) or [@scalar-labs/scalardl-node-client-sdk](https://github.com/scalar-labs/scalardl-node-client-sdk) to create Scalar DLT applications.

## How to update JavaScript-based SDKs

The files *scalardl-web-client-sdk* and *scalardl-node-client-sdk* are based on *scalardl-javascript-sdk-base*. So if you update the *scalardl-javascript-sdk-base*, you also need to update those SDKs. This following describes how to do it properly.

### Upgrade the scalardl-javascript-sdk-base version

After modifying the implementation of scalardl-javascript-sdk-base, we have to upgrade the version field in the  package.json. It looks like this:

```
"version": "1.3.1",
```

The version conforms to the rules of [semantic versioning](https://semver.org/). After the package.json is upgraded with a new version, push the package to the NPM registry with `npm publish`.

### Upgrade scalardl-javascript-sdk-base in Web and Node.js SDK

We have to update the package.json by the upgrading scalardl-javascript-sdk-base. [Yarn](https://yarnpkg.com/lang/en/docs/install/#mac-stable) is the tool used to manage NPM packages. To upgrade *scalardl-javascript-sdk-base*, go to the root folders of *scalardl-web-client* and *scalardl-node-client-sdk* which contain the  package.json file, and use this command:

```
yarn upgrade @scalar-labs/scalardl-javascript-sdk-base
```

This command will update the `package.json` and `yarn.lock` files.

## How to regenerate static files for scalardl-web-client-sdk

Make sure you have installed the [proto buffer compiler](http://google.github.io/proto-lens/installing-protoc.html) and [protoc-gen-grpc-web](https://github.com/grpc/grpc-web/releases) plugins. Then go to the folder containing scalar.proto and execute the command:

```
protoc --js_out=import_style=commonjs:. --grpc-web_out=import_style=commonjs,mode=grpcwebtext:. scalar.proto
```

Then, you will see two newly generated files **scalar_grpc_web_pb.js** and **scalar_pb.js**. Update these two files to https://github.com/scalar-labs/scalardl-web-client-sdk.

Make sure in the code that the ClientServiceBase has been initialized correctly.

## How to regenerate static files for scalardl-node-client-sdk

Make sure you have installed [grpc-tools](https://www.npmjs.com/package/grpc-tools) (global installation recommended). Then, go to the folder containing scalar.proto and execute the command:

```
grpc_tools_node_protoc --js_out=import_style=commonjs,binary:. --grpc_out=. --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` scalar.proto
```

*Note: If you install grpc-tools locally, you will need to modify the above command to manually include the path of the grpc tools in the node_modules folder.

Then, you will see two newly generated files **scalar_grpc_pb.js** and **scalar_pb.js**. Update this two files to https://github.com/scalar-labs/scalardl-node-client-sdk.

## Upgrade the version of scalardl-web-client-sdk and scalardl-node-client-sdk

In the same way we update the version of *scalardl-javascript-sdk-base*, we also use semantic versioning to update version fields in the package.json files of *scalardl-web-client-sdk* and *scalardl-node-client-sdk*, and then push them to the NPM registry with `npm publish`.
