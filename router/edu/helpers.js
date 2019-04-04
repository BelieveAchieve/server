const uri = require('querystring').escape

// Return an object containing the `path` and `label` for a given category /
// subcategory link
const questionsPath = (category, subcategory) => {
  const query = []

  if (category) {
    query.push(`category=${uri(category)}`)
  }

  if (subcategory) {
    query.push(`subcategory=${uri(subcategory)}`)
  }

  return {
    path: `questions?${query.join('&')}`,
    label: subcategory || category
  }
}

// Return a function used by templates to determine if the current page is the
// one currently selected on the navbar.
const isActivePage = req => {
  return navUrl => {
    return navUrl === req.path ? 'active' : ''
  }
}

module.exports = {
  questionsPath,
  isActivePage
}
