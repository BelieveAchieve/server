/* eslint-env jquery */
/* global MathJax:readonly  */

// Question Tile: Edit Button
$('.js-question-tile').on('click', '.js-edit-button', e => {
  e.preventDefault()
  const $tile = $(e.target).closest('.js-question-tile')
  const $tileFlash = $tile.find('.js-tile-flash')
  $tileFlash.text('').removeClass('alert alert-danger alert-success')
  $tile.find('.js-question-form').removeClass('d-none')
  $tile.find('.js-question-rendered').addClass('d-none')
})

// Question Form: Cancel Button
$('.js-question-tile').on('click', '.js-cancel-button', e => {
  e.preventDefault()
  const $tile = $(e.target).closest('.js-question-tile')
  $tile.find('.js-question-form').addClass('d-none')
  $tile.find('.js-question-rendered').removeClass('d-none')
  const $form = $tile.find('.js-question-form').first()
  const $formFlash = $form.find('.js-form-flash')
  $formFlash.text('').removeClass('alert alert-danger alert-success')
})

// Question Tile: Delete Button
$('.js-question-tile').on('click', '.js-delete-button', e => {
  e.preventDefault()

  const $tile = $(e.target).closest('.js-question-tile')
  const $tileFlash = $tile.find('.js-tile-flash')
  $tileFlash.removeClass('alert alert-danger alert-success')

  const resp = window.confirm('Are you sure you want to delete this question?')
  if (!resp) {
    $tileFlash.text('Deletion Canceled.')
    $tileFlash.addClass('alert alert-danger')
    return
  }

  const $form = $tile.find('.js-question-form').first()
  const $formFlash = $form.find('.js-form-flash')
  $formFlash.removeClass('alert alert-danger alert-success')

  const questionId = $tile.attr('id')
  const request = {
    type: 'delete',
    contentType: 'application/json; charset=utf-8',
    url: `/edu/questions/${questionId}`,
    dataType: 'json'
  }

  $.ajax(request)
    .done(resp => $tile.remove())
    .fail(resp => {
      console.error('Request failed. Sent:', request)
      console.error(`Received ${resp.status} response: `, resp.responseText)
      $formFlash.text('Deletion failed.')
      $formFlash.addClass('alert alert-danger')
    })
})

// Question Form: Save Button
$('.js-question-tile').on('click', '.js-save-button', e => {
  e.preventDefault()
  const $tile = $(e.target).closest('.js-question-tile')
  const $tileFlash = $tile.find('.js-tile-flash')
  $tileFlash.removeClass('alert alert-danger alert-success')

  const $form = $tile.find('.js-question-form').first()

  // Validate form has all required values
  const $requiredInputs = $form.find('input[required],textarea[required]')
  $requiredInputs.toArray().forEach(e => $(e).removeClass('invalid'))
  const missingValues = $requiredInputs.toArray().filter(e => !e.value)

  if (missingValues.length > 0) {
    missingValues.forEach(e => $(e).addClass('invalid'))
    return
  }

  const $formFlash = $form.find('.js-form-flash')
  $formFlash.removeClass('alert alert-danger alert-success')

  const question = $form.serializeJSON()
  question.possibleAnswers = question.possibleAnswers.filter(e => e.txt)

  const request = {
    type: $form.attr('method'),
    contentType: 'application/json; charset=utf-8',
    url: $form.attr('action'),
    data: JSON.stringify({ question }),
    dataType: 'json'
  }

  $.ajax(request)
    .done(resp => {
      const {
        _id,
        category,
        subcategory,
        questionText,
        possibleAnswers,
        correctAnswer,
        imageSrc
      } = resp.question

      const categoryUri = encodeURIComponent(category)
      const subUri = encodeURIComponent(subcategory)
      $tile.attr('id', _id)
      $tile
        .find(`.js-category-link`)
        .attr('href', `/edu/questions?category=${categoryUri}`)
      $tile
        .find(`.js-subcategory-link`)
        .attr('href', `/edu/questions?subcategory=${subUri}`)
      $tile.find(`.js-category`).text(category)
      $tile.find(`.js-subcategory`).text(subcategory)
      $tile.find(`.js-questionText`).text(questionText)

      if (imageSrc) {
        $tile.find('.js-image img').removeClass('d-none')
        $form.find('.js-image img').removeClass('d-none')
        $tile.find('.js-image img').attr('src', imageSrc)
        $form.find('.js-image img').attr('src', imageSrc)
      } else {
        $tile.find('.js-image img').addClass('d-none')
        $form.find('.js-image img').addClass('d-none')
      }

      // Clear possible answers
      $tile
        .find('.js-possibleAnswers')
        .find('.js-possibleAnswer')
        .toArray()
        .forEach(option => $(option).text(''))

      // Populate any persisted possible answers
      possibleAnswers.forEach(({ val, txt }) => {
        const $option = $tile.find(`.js-possibleAnswers-${val}`)
        $option.removeClass('font-weight-bold')

        if (txt) {
          $option.text(`${val}. ${txt}`)
        }

        if (val === correctAnswer) {
          $option.addClass('font-weight-bold')
        }
      })

      $tileFlash.text('Update succeeded.')
      $tileFlash.addClass('alert alert-success')

      $tile.find('.js-question-form').addClass('d-none')
      $tile.find('.js-question-rendered').removeClass('d-none')
      $tile.find('.js-delete-button').removeClass('d-none')

      // re-typeset math
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, $tile[0]])
    })
    .fail(resp => {
      console.error('Request failed. Sent:', request)
      console.error(`Received ${resp.status} response: `, resp.responseText)
      $formFlash.text('Update failed.')
      $formFlash.addClass('alert alert-danger')
    })
})
