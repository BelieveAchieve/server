const Question = require('../../../models/Question')

test('Called getSubcategories using good data', () => {
  const subcategories = Question.getSubcategories('algebra')
  expect(subcategories[0]).toBe('linear equations')
})

test('Called getSubcategories using nonexistant category', () => {
  expect(() => {
    Question.getSubcategories('math')
  }).toThrowError(ReferenceError)
})

test.todo('Called getSubcategories using wrong capitalization data')

test('Called getSubcategories using wrong type', () => {
  expect(() => {
    Question.getSubcategories(1)
  }).toThrowError(TypeError)
})

test('Checks that parse questions contains only insensitive data', () => {
  const q = new Question({
    questionText: 'test',
    possibleAnswers: { txt: 'righttest', val: '1' },
    correctAnswer: 'correctAnswer',
    subcategory: 'sub',
    imageSrc: 'imagesrc'
  })

  const qt = q.parseQuestion()

  expect(qt.questionText).toBe(q.questionText)

  // Returns undefined when not referencing 0th index of possibleAnswers array.
  // Maybe something to do with the mongoose array? bug with db?
  expect(qt.possibleAnswers[0].txt).toBe('righttest')
  expect(qt.possibleAnswers[0].val).toBe('1')

  // Sensitive data that was censored
  expect(qt.correctAnswer).toBe(undefined)
  expect(qt.subcategory).toBe(undefined)
  expect(qt.category).toBe(undefined)

  // Undefined because parseQuestion contains an image, not the src.
  expect(qt.imageSrc).toBe(undefined)

  // id is part of possibleAnswers. Bug with db?
  expect(qt.possibleAnswers[0].id).not.toBe(undefined)
})
