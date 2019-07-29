const test = require('ava')
const Question = require('./Question')

test('Called getSubcategories using good data', t => {
	let subcategories = Question.getSubcategories("algebra")
  t.is(subcategories[0], 'linear equations')
})


test('Called getSubcategories using nonexistant category', t => {
	let subcategories = Question.getSubcategories("math")
  t.is(subcategories[0], 'linear equations')
})

test('Called getSubcategories using wrong capitalization data', t => {
	let subcategories = Question.getSubcategories("Algebra")
  t.is(subcategories[0], 'linear equations')
})

test('Called getSubcategories using numbers', t => {
	let subcategories = Question.getSubcategories("Algebra")
  t.is(subcategories[0], 'linear equations')
})

test('Called getSubcategories using negative numbers', t => {
	let subcategories = Question.getSubcategories("Algebra")
  t.is(subcategories[0], 'linear equations')
})


test('Checks that parse questions contains only insensitive data', t => {
	let q = new Question({
			questionText: "test",
			possibleAnswers:{txt:"righttest", val:"1"},
			correctAnswer: "correctAnswer",
			subcategory:"sub",
			imageSrc:"imagesrc",
  })

	let qt = q.parseQuestion()

	t.is(qt.questionText, q.questionText)

	// Returns undefined when not referencing 0th index of possibleAnswers array.
	// Maybe something to do with the mongoose array? bug with db?
	t.is(qt.possibleAnswers[0].txt, "righttest")
	t.is(qt.possibleAnswers[0].val, "1")

	// Sensitive data that was censored 
	t.is(qt.correctAnswer, undefined)
	t.is(qt.subcategory, undefined)
	t.is(qt.category, undefined)

	// Undefined because parseQuestion contains an image, not the src. 
	t.is(qt.imageSrc, undefined)

	// id is part of possibleAnswers. Bug with db?
	t.not(qt.possibleAnswers[0].id, undefined)
})



