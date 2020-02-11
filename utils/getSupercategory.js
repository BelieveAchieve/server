const getSupercategory = subcategory => {
  let category = ''
  switch (subcategory.toLowerCase()) {
    case 'algebra':
    case 'precalculus':
    case 'trigonometry':
    case 'geometry':
    case 'calculus':
      category = 'Math'
      break
    case 'planning':
    case 'essays':
    case 'applications':
      category = 'College Counseling'
      break
    default:
      break
  }
  return category
}

module.exports = getSupercategory
