# node-red-contrib-json-rpc-processor

A Node-RED node to process and validate JSON RPC 2.0 messages.

## Purpose

[JSON RPC 2.0](https://www.jsonrpc.org) is a lightweight request/response protocol that is well suited to process incoming messages in the Node-RED environement.

There are already JSON RPC 2.0 related nodes like [node-red-contrib-jsonrpc](https://flows.nodered.org/node/node-red-contrib-jsonrpc). That node wraps the [node-jsonrpc2](https://www.npmjs.com/package/json-rpc2) library which bakes the transport (http, tcp) within the library.  

I wanted tp create a node that is transport agnostic to leverage the different transport nodes that are available within Node-RED's core library (http, tcp, udp, websockets, mqtt).  The result is `node-red-contrib-json-rpc-processor`, it's role is to parse and validate incoming messages as well as format responses.

## Usage

The node is used in a similar fashion as some of the parser nodes like the JSON node, one instance is used after the transport to parse and validate the message and another instance is used before the response to format the outgoing message.

![server](https://github.com/natcl/node-red-contrib-jsonrpc-processor/raw/master/docs/images/server.png "Server")

### Specifying methods

In order to work, the node needs to know which method it needs to process and validate. The methods to process are passed to the node using the `msg.methods` property. Each method has a [JSON Schema](https://json-schema.org) attached to it that will allow the node to validate the method's parameters. Here is a simple example that defines two methods:

```json
{
  "getRandomAnimal": {
    "request": {
      "title": "getRandomAnimal",
      "type": "object"
    }
  },
  "add": {
    "request": {
      "title": "add",
      "type": "object",
      "properties": {
        "number1": {
          "type": "number",
          "minimum": 0
        },
        "number2": {
          "type": "number",
          "minimum": 0
        }
      },
      "required": [
        "number1",
        "number2"
      ]
    }
  }
}
```

In the above example, we define two methods, `getRandomAnimal` and `add`. The `getRandomAnimal` method doesn't have any parameters so we simply define an empty schema (`{"type": "object"}`) in the `request` property of the method.  

For the `add` method we specify two parameters, `number1` and `number2` which are both of type `number` with a minimum value of 0. Note also that both properties are required.

### Processing an incoming message

When processing an incoming message, if the message is valid the parameters will be sent on the first output as `msg.payload`. If the message is not valid (badly formatted JSON RPC 2.0 or parameters that don't validate against the [JSON Schema](https://json-schema.org)) a JSON RPC 2.0 error will be sent out of the second output which can be sent directly as a response.

A valid message will also have it's method in `msg.rpcMethod` and extra information like the `id` of the message in `msg.rpcData`.  

The `rpcMethod` would typically be used to route the message to a function, flow or subflow using a `switch` node.

### Processing the parameters

The actual processing of the parameters can be done any way the user wants, could be a normal flow, a function, a subflow etc.  The result needs to be in `msg.payload` and sent to the second `node-red-contrib-jsonrpc-processor` where the response will be formatted. It is important the message still has the properties originating from the first node (`msg.rpcData` and `msg.rpcMethod`) for the node to work properly.

If the user needs to generate an error he can use a function node with the usual `node.error('Error message', msg)` mechanism along with a catch node connected to the second `node-red-contrib-jsonrpc-processor`.  The node will automatically format the error.
