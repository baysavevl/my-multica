import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  initialTodoState,
  learningSummary,
  learningTopics,
  practiceById,
  todoItems,
  toggleTodo,
  topicById
} from './learningWorkbench.js'

test('learning topics include complete lesson, demo, showcase, practice, and todo content', () => {
  assert.equal(learningTopics.length >= 10, true)

  for (const topic of learningTopics) {
    assert.equal(Boolean(topic.id), true)
    assert.equal(Boolean(topic.title), true)
    assert.equal(Boolean(topic.summary), true)
    assert.equal(topic.learn.length >= 2, true)
    assert.equal(Boolean(topic.demo.command || topic.demo.action), true)
    assert.equal(topic.showcase.length >= 2, true)
    assert.equal(Boolean(topic.practice.id), true)
    assert.equal(Boolean(topic.practice.goal), true)
    assert.equal(topic.practice.steps.length >= 2, true)
    assert.equal(topic.todos.length >= 2, true)
  }
})

test('topic and practice lookup return stable records by id', () => {
  const topic = topicById('runtime')
  const practice = practiceById('practice-runtime-refresh')

  assert.equal(topic.title, 'Runtime')
  assert.equal(practice.topicId, 'runtime')
  assert.equal(practice.goal.includes('runtime'), true)
})

test('todo helpers initialize, toggle, and summarize progress', () => {
  const firstTodo = todoItems[0]
  const state = initialTodoState()
  const toggled = toggleTodo(state, firstTodo.id)
  const restored = toggleTodo(toggled, firstTodo.id)
  const summary = learningSummary(toggled)

  assert.equal(Object.keys(state).length, todoItems.length)
  assert.equal(state[firstTodo.id], false)
  assert.equal(toggled[firstTodo.id], true)
  assert.equal(restored[firstTodo.id], false)
  assert.equal(summary.completed, 1)
  assert.equal(summary.total, todoItems.length)
  assert.equal(summary.percent, Math.round((1 / todoItems.length) * 100))
  assert.equal(summary.nextTodo.id, todoItems[1].id)
})
