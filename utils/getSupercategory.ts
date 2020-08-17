import {
  MATH_CERTS,
  SCIENCE_CERTS,
  COLLEGE_CERTS,
  STANDARDIZED_TESTING_CERTS
} from '../constants';

const getSupercategory = (subcategory): string => {
  let category = '';

  if (Object.values(MATH_CERTS).includes(subcategory)) category = 'MATH';
  if (Object.values(SCIENCE_CERTS).includes(subcategory)) category = 'SCIENCE';
  if (Object.values(COLLEGE_CERTS).includes(subcategory)) category = 'COLLEGE';
  if (Object.values(STANDARDIZED_TESTING_CERTS).includes(subcategory))
    category = 'STANDARDIZED TESTING';

  return category;
};

module.exports = getSupercategory;
export default getSupercategory;
