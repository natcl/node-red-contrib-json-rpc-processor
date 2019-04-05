module.exports = function (RED) {
  const Ajv = require('ajv')
  const ajv = new Ajv({ allErrors: true, schemaId: 'auto' })
  ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))
  ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))
  let validateJsonRpc2Schema = null
  try {
    validateJsonRpc2Schema = ajv.compile(require('./schemas/JSON-RPC-2.0.json'))
  } catch (error) {
    console.error(`json-rpc-processor error: Can't compile main JSON-RPC 2.0 schema`, error)
  }

  function jsonrpcProcessor (config) {
    RED.nodes.createNode(this, config)
    var node = this
    node.methods = {}
    node.on('input', function (msg) {
      // ingest and compile schema
      if (msg.methods) {
        if (typeof msg.methods === 'object') {
          for (let method in msg.methods) {
            try {
              let compiledSchema = ajv.compile(msg.methods[method].request)
              node.methods[method] = msg.methods[method]
              node.methods[method].validate = compiledSchema
            } catch (error) {
              node.error(`json-rpc-processor error: Can't compile schema for method ${method}, ignoring this method`, msg)
              if (node.methods[method]) delete node.methods[method]
            }
          }
          node.warn(node.methods)
        } else if (typeof msg.methods !== 'object') {
          node.warn('Methods should be a valid object')
        }
        return
      }

      // process payload
      if (msg.payload) {
        // Validate that payload is valid JSON-RPC 2.0
        if (!validateJsonRpc2Schema(msg.payload)) {
          msg.payload = {
            'jsonrpc': '2.0',
            'error': {
              'code': -32600,
              'message': 'Invalid Request',
              'data': validateJsonRpc2Schema.errors
            },
            'id': -1
          }
          node.error(`json-rpc-processor error: invalid JSON-RPC 2.0: ${ajv.errorsText(validateJsonRpc2Schema.errors)}`, msg)
          node.send([null, msg])
        }
      }
    })
  }
  RED.nodes.registerType('json-rpc-processor', jsonrpcProcessor)
}
