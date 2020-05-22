const getSupercategory = subcategory => {
  let category = ''
  switch (subcategory.toLowerCase()) {
    case 'prealgebra':
    case 'algebra':
    case 'precalculus':
    case 'trigonometry':
    case 'geometry':
    case 'calculus':
      category = 'MATH'
      break
    case 'planning':
    case 'essays':
    case 'applications':
      category = 'COLLEGE'
      break
    case 'biology':
    case 'chemistry':
    case 'physics':
      category = 'SCIENCE'
      break
    default:
      break
  }
  return category
}

module.exports = getSupercategory
