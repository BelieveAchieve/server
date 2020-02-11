const getSupercategory = subcategory => {
  let category = ''
  switch (subcategory.toLowerCase()) {
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
    default:
      break
  }
  return category
}

module.exports = getSupercategory
