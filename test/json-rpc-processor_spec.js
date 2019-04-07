/* eslint-env mocha */
var helper = require('node-red-node-test-helper')
var jsonrpcprocessorNode = require('../json-rpc-processor.js')

helper.init(require.resolve('node-red'))

describe('json-rpc-processor Node', function () {

  afterEach(function () {
    helper.unload()
  })

  it('should be loaded', function (done) {
    var flow = [{ id: 'n1', type: 'json-rpc-processor', name: 'json-rpc-processor' }];
    helper.load(jsonrpcprocessorNode, flow, function () {
      var n1 = helper.getNode('n1')
      n1.should.have.property('name', 'json-rpc-processor')
      done()
    })
  })
})
