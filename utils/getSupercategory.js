const getSupercategory = subcategory => {
  let category = ''
  switch (subcategory.toLowerCase()) {
    case 'prealgebra':
    case 'algebra':
    case 'precalculus':
    case 'trigonometry':
    case 'geometry':
    case 'calculus':
    case 'integratedmathone':
    case 'integratedmathtwo':
    case 'integratedmaththree':
    case 'integratedmathfour':
      category = 'MATH'
      break
    case 'planning':
    case 'essays':
    case 'applications':
      category = 'COLLEGE'
      break
    case 'biology':
      category = 'SCIENCE'
      break
    default:
      break
  }
  return category
}

module.exports = getSupercategory
