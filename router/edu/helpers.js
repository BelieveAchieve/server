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

// Convert a given path of a front-end-served asset to the correct absolute or
// relative path, based on the given frontEndRoot
const frontEndPath = (relativePath, frontEndRoot) => {
  if (frontEndRoot) {
    return new URL(relativePath, frontEndRoot).toString()
  } else {
    return relativePath
  }
}

module.exports = {
  questionsPath,
  isActivePage,
  frontEndPath
}
