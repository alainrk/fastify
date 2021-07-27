'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('..')

test('default error handler', t => {
  test('with plugin throwing', t => {
    t.plan(3)

    const fastify = Fastify()

    fastify.register((instance, options, done) => {
      instance.get('/b', function (req, reply) {
        throw new Error('/a/b error')
      })

      done()
    }, { prefix: '/a' })

    fastify.inject({
      url: '/a/b',
      method: 'GET'
    }, (err, res) => {
      t.error(err)
      t.equal(res.statusCode, 500)
      const payload = JSON.parse(res.payload)
      t.same(payload.message, '/a/b error')
    })
  })

  test('with nested plugin throwing', t => {
    t.plan(3)

    const fastify = Fastify()

    fastify.register((instance, options, done) => {
      instance.register((subinstance, options, done) => {
        subinstance.get('/c', function (req, reply) {
          throw new Error('/a/b/c error')
        })
        done()
      }, { prefix: '/b' })

      done()
    }, { prefix: '/a' })

    fastify.inject({
      url: '/a/b/c',
      method: 'GET'
    }, (err, res) => {
      t.error(err)
      t.equal(res.statusCode, 500)
      const payload = JSON.parse(res.payload)
      t.same(payload.message, '/a/b/c error')
    })
  })

  t.end()
})

test('custom error handler', t => {
  test('custom root error handling with nested plugin throwing', t => {
    t.plan(3)

    const fastify = Fastify()

    fastify.register((instance, options, done) => {
      instance.register((subinstance, options, done) => {
        subinstance.get('/c', function (req, reply) {
          throw new Error('/a/b/c error')
        })
        done()
      }, { prefix: '/b' })

      done()
    }, { prefix: '/a' })

    fastify.setErrorHandler((_err, req, reply) => {
      throw new Error('/ error')
    })

    fastify.inject({
      url: '/a/b/c',
      method: 'GET'
    }, (err, res) => {
      t.error(err)
      t.equal(res.statusCode, 500)
      const payload = JSON.parse(res.payload)
      t.same(payload.message, '/ error')
    })
  })

  test('custom root and custom plugin error handling with nested plugin throwing', t => {
    t.plan(3)

    const fastify = Fastify()

    fastify.register((instance, options, done) => {
      instance.setErrorHandler((_err, req, reply) => {
        throw new Error('/a error')
      })

      instance.register((subinstance, options, done) => {
        subinstance.get('/c', function (req, reply) {
          throw new Error('/a/b/c error')
        })
        done()
      }, { prefix: '/b' })

      done()
    }, { prefix: '/a' })

    fastify.setErrorHandler((_err, req, reply) => {
      throw new Error('/ error')
    })

    fastify.inject({
      url: '/a/b/c',
      method: 'GET'
    }, (err, res) => {
      t.error(err)
      t.equal(res.statusCode, 500)
      const payload = JSON.parse(res.payload)
      t.same(payload.message, '/a error')
    })
  })

  t.end()
})
