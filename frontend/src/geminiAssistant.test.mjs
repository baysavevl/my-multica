import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  GEMINI_ASSISTANT_HEADER,
  askGemini,
  geminiModes,
  geminiSetupRequest,
  validateGeminiAskInput
} from './geminiAssistant.js'

test('validateGeminiAskInput rejects missing topic, unsupported mode, and long text', () => {
  assert.deepEqual(validateGeminiAskInput({ topicId: '', mode: 'explain', question: 'What is a runtime?' }), ['Choose a Multica topic.'])
  assert.deepEqual(validateGeminiAskInput({ topicId: 'runtime', mode: 'debug', question: 'What is a runtime?' }), ['Choose a supported Gemini mode.'])
  assert.deepEqual(validateGeminiAskInput({ topicId: 'runtime', mode: 'review', question: 'x'.repeat(4001) }), ['Question is too long.'])
  assert.deepEqual(validateGeminiAskInput({ topicId: 'runtime', mode: 'review', answer: 'x'.repeat(4001) }), ['Answer is too long.'])
  assert.deepEqual(validateGeminiAskInput({ topicId: 'runtime', mode: 'explain', question: 'What is a runtime?' }), [])
})

test('geminiSetupRequest includes local guard header', async () => {
  const originalFetch = globalThis.fetch
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"ok":true,"geminiCli":{"installed":false}}'
    }
  }

  try {
    const body = await geminiSetupRequest()
    assert.equal(body.ok, true)
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.equal(request.url, '/api/gemini/setup')
  assert.equal(request.options.headers[GEMINI_ASSISTANT_HEADER], 'local-ui')
})

test('askGemini posts request body and returns disabled backend response', async () => {
  const originalFetch = globalThis.fetch
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"ok":false,"disabled":true,"message":"Gemini API key is not configured","model":"gemini-2.5-flash"}'
    }
  }

  try {
    const body = await askGemini({
      topicId: 'runtime',
      mode: geminiModes.explain,
      question: 'Explain runtimes'
    })
    assert.equal(body.disabled, true)
    assert.equal(body.model, 'gemini-2.5-flash')
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.equal(request.url, '/api/gemini/ask')
  assert.equal(request.options.method, 'POST')
  assert.equal(request.options.headers[GEMINI_ASSISTANT_HEADER], 'local-ui')
  assert.deepEqual(JSON.parse(request.options.body), {
    topicId: 'runtime',
    mode: 'explain',
    question: 'Explain runtimes',
    answer: ''
  })
})
