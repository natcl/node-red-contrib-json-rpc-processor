/* eslint-env mocha */
var helper = require('node-red-node-test-helper')
var jsonRpcNode = require('../json-rpc-processor.js')

helper.init(require.resolve('node-red'))

const goodMethods = {
  'getRandomAnimal': {
    'request': {
      'title': 'getRandomAnimal',
      'type': 'object'
    }
  },
  'add': {
    'request': {
      'title': 'add',
      'type': 'object',
      'properties': {
        'number1': {
          'type': 'number',
          'minimum': 0
        },
        'number2': {
          'type': 'number',
          'minimum': 0
        }
      },
      'required': [
        'number1',
        'number2'
      ]
    }
  }
}

const badMethods = {
  'getRandomAnimal': {
    'request': {
      'title': 'getRandomAnimal',
      'type': 'object'
    }
  },
  'add': {
    'request': {
      'tile': 'add',
      'type': 'objecte',
      'properties': {
        'number1': {
          'type': 'cat',
          'minimum': 0
        },
        'number2': {
          'type': 'dog',
          'minimum': 0
        }
      },
      'required': [
        'number1',
        'number2'
      ]
    }
  }
}

describe('json-rpc-processor Node', function () {
  afterEach(function () {
    helper.unload()
  })

  it('should be loaded', function (done) {
    var flow = [{ id: 'n1', type: 'json-rpc-processor', name: 'json-rpc-processor' }]
    helper.load(jsonRpcNode, flow, function () {
      var n1 = helper.getNode('n1')
      n1.should.have.property('name', 'json-rpc-processor')
      done()
    })
  })

  it('should return an error if the JSON-RPC 2.0 payload is not valid JSON', function (done) {
    var flow = [
      { id: 'n1', type: 'json-rpc-processor', name: 'json-rpc-processor', wires: [ [], ['n2'] ] },
      { id: 'n2', type: 'helper' }
    ]
    helper.load(jsonRpcNode, flow, function () {
      var n2 = helper.getNode('n2')
      var n1 = helper.getNode('n1')
      n2.on('input', function (msg) {
        try {
          msg.payload.should.have.property('jsonrpc', '2.0')
          msg.payload.should.have.property('id', -1)
          msg.payload.error.should.have.property('code', -32600)
          msg.payload.error.should.have.property('message', 'Invalid Request')
        } catch (error) {
          done(error)
        }
      })
      n1.receive({ payload: '{{}}' })
      helper.log().called.should.be.true()
      var logEvents = helper.log().args.filter(function (evt) {
        return evt[0].type === 'json-rpc-processor'
      })
      var err = logEvents[0][0]
      try {
        err.msg.should.match(/^json-rpc-processor error: invalid JSON-RPC 2.0: /)
        done()
      } catch (error) {
        done(error)
      }
    })
  })

  it('should return an error if the JSON-RPC 2.0 payload is not valid JSON-RPC 2.0', function (done) {
    var flow = [
      { id: 'n1', type: 'json-rpc-processor', name: 'json-rpc-processor', wires: [ [], ['n2'] ] },
      { id: 'n2', type: 'helper' }
    ]
    helper.load(jsonRpcNode, flow, function () {
      var n2 = helper.getNode('n2')
      var n1 = helper.getNode('n1')
      n2.on('input', function (msg) {
        try {
          msg.payload.should.have.property('jsonrpc', '2.0')
          msg.payload.should.have.property('id', -1)
          msg.payload.error.should.have.property('code', -32600)
          msg.payload.error.should.have.property('message', 'Invalid Request')
        } catch (error) {
          done(error)
        }
      })
      n1.receive({ payload: {
        'jsonrpc': '3.0',
        'method': 'add',
        'params': { 'number1': 3, 'number2': 'Hello' },
        'id': 'c09edd92.71da5'
      }
      })
      helper.log().called.should.be.true()
      var logEvents = helper.log().args.filter(function (evt) {
        return evt[0].type === 'json-rpc-processor'
      })
      var err = logEvents[0][0]
      try {
        err.msg.should.match(/^json-rpc-processor error: invalid JSON-RPC 2.0: /)
        done()
      } catch (error) {
        done(error)
      }
    })
  })

  it('should return an error if the method is not found', function (done) {
    var flow = [
      { id: 'n1', type: 'json-rpc-processor', name: 'json-rpc-processor', wires: [ [], ['n2'] ] },
      { id: 'n2', type: 'helper' }
    ]
    helper.load(jsonRpcNode, flow, function () {
      var n2 = helper.getNode('n2')
      var n1 = helper.getNode('n1')
      n2.on('input', function (msg) {
        try {
          msg.payload.should.have.property('jsonrpc', '2.0')
          msg.payload.should.have.property('id', '1234')
          msg.payload.error.should.have.property('code', -32601)
          msg.payload.error.message.should.match(/^Method.*not found$/)
        } catch (error) {
          done(error)
        }
      })
      n1.receive({ payload: {
        'jsonrpc': '2.0',
        'method': 'getRandomAnimal',
        'params': {},
        'id': '1234'
      }
      })
      helper.log().called.should.be.true()
      var logEvents = helper.log().args.filter(function (evt) {
        return evt[0].type === 'json-rpc-processor'
      })
      var err = logEvents[0][0]
      try {
        err.msg.should.match(/^json-rpc-processor error: method.*not found/)
        done()
      } catch (error) {
        done(error)
      }
    })
  })

  it('should return the params as msg.payload', function (done) {
    var flow = [
      { id: 'n1', type: 'json-rpc-processor', name: 'json-rpc-processor', wires: [ ['n2'], [] ] },
      { id: 'n2', type: 'helper' }
    ]
    helper.load(jsonRpcNode, flow, function () {
      var n2 = helper.getNode('n2')
      var n1 = helper.getNode('n1')
      n2.on('input', function (msg) {
        try {
          msg.should.have.property('rpcMethod', 'getRandomAnimal')
          msg.rpcData.should.have.property('id', '1234')
          msg.rpcData.should.have.property('method', 'getRandomAnimal')
          msg.payload.should.deepEqual({})
          done()
        } catch (error) {
          done(error)
        }
      })
      n1.receive({ methods: goodMethods })
      n1.receive({ payload: {
        'jsonrpc': '2.0',
        'method': 'getRandomAnimal',
        'params': {},
        'id': '1234'
      }
      })
    })
  })

  it('should return a JSON-RPC 2.0 error if the params are wrong', function (done) {
    var flow = [
      { id: 'n1', type: 'json-rpc-processor', name: 'json-rpc-processor', wires: [ [], ['n2'] ] },
      { id: 'n2', type: 'helper' }
    ]
    helper.load(jsonRpcNode, flow, function () {
      var n2 = helper.getNode('n2')
      var n1 = helper.getNode('n1')
      n2.on('input', function (msg) {
        try {
          msg.should.have.property('rpcMethod', 'add')
          msg.rpcData.should.have.property('id', '1234')
          msg.rpcData.should.have.property('method', 'add')
          msg.payload.error.should.have.property('code', -32602)
          msg.payload.error.should.have.property('message', 'Invalid params')
        } catch (error) {
          done(error)
        }
      })
      n1.receive({ methods: goodMethods })
      n1.receive({ payload: {
        'jsonrpc': '2.0',
        'method': 'add',
        'params': { 'number1': -3, 'number2': 5 },
        'id': '1234'
      }
      })
      helper.log().called.should.be.true()
      var logEvents = helper.log().args.filter(function (evt) {
        return evt[0].type === 'json-rpc-processor'
      })
      var err = logEvents[1][0]
      try {
        err.msg.should.match(/^json-rpc-processor error: invalid parameters: /)
        done()
      } catch (error) {
        done(error)
      }
    })
  })

  it('should return an error if invalid methods are provided', function (done) {
    var flow = [
      { id: 'n1', type: 'json-rpc-processor', name: 'json-rpc-processor' }
    ]
    helper.load(jsonRpcNode, flow, function () {
      var n1 = helper.getNode('n1')
      n1.receive({ methods: badMethods })
      try {
        helper.log().called.should.be.true()
        var logEvents = helper.log().args.filter(function (evt) {
          return evt[0].type === 'json-rpc-processor'
        })
        var msg = logEvents[0][0]
        msg.should.have.property('msg', `json-rpc-processor error: Can't compile schema for method add, ignoring this method`)
        n1.methods.should.have.property('getRandomAnimal')
        n1.methods.should.not.have.property('add')
        done()
      } catch (error) {
        done(error)
      }
    })
  })

  it('should have compiled methods if valid methods are passed', function (done) {
    var flow = [
      { id: 'n1', type: 'json-rpc-processor', name: 'json-rpc-processor' }
    ]
    helper.load(jsonRpcNode, flow, function () {
      var n1 = helper.getNode('n1')
      n1.receive({ methods: goodMethods })
      try {
        n1.methods.should.have.property('getRandomAnimal')
        n1.methods.should.have.property('add')
        n1.methods.getRandomAnimal.should.have.property('validate')
        n1.methods.add.should.have.property('validate')
        n1.methods.getRandomAnimal.should.have.property('request')
        n1.methods.add.should.have.property('request')
        done()
      } catch (error) {
        done(error)
      }
    })
  })
})
