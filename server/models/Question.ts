import { Document, Model, model, Schema, Types } from 'mongoose';
import {
  TRAINING,
  MATH_CERTS,
  SCIENCE_CERTS,
  COLLEGE_CERTS,
  COLLEGE_SUBJECTS,
  SAT_CERTS
} from '../constants';

export interface Question {
  _id: Types.ObjectId;
  questionText: string;
  possibleAnswers: {
    txt: string;
    val: string;
  }[];
  correctAnswer: string;
  category: string;
  subcategory: string;
  imageSrc: string;
}

export type QuestionDocument = Question & Document;

interface QuestionStaticModel extends Model<QuestionDocument> {
  getSubcategories(category: string): string[];
}

const questionSchema = new Schema({
  questionText: String,
  possibleAnswers: [{ txt: String, val: String }],
  correctAnswer: String,
  category: String,
  subcategory: String,
  imageSrc: String
});

// Given a question record, strip out sensitive data for public consumption
questionSchema.methods.parseQuestion = function(): Partial<Question> {
  return {
    _id: this._id,
    questionText: this.questionText,
    possibleAnswers: this.possibleAnswers,
    imageSrc: this.image
  };
};

questionSchema.statics.getSubcategories = function(category: string): string[] {
  const categoryToSubcategoryMap = {
    [MATH_CERTS.PREALGREBA]: [
      'numbers',
      'arithmetic properties',
      'exponents',
      'exponents and radicals',
      'polynomials',
      'fractions'
    ],
    [MATH_CERTS.ALGEBRA]: [
      'linear equations',
      'rational exponents and radicals',
      'application of linear equations',
      'two variable equations',
      'rational expressions',
      'complex numbers'
    ],
    [MATH_CERTS.GEOMETRY]: [
      'congruence and similarity',
      'vertices',
      'angles',
      'circles',
      'triangles',
      'rectangles'
    ],
    [MATH_CERTS.TRIGONOMETRY]: [
      'angles',
      'triangles',
      'right triangles',
      'quadrants',
      'radians',
      'unit circle',
      'inequalities'
    ],
    [MATH_CERTS.STATISTICS]: [
      'representing data numerically',
      'representing data graphically',
      'two means',
      'two proportions',
      'levels of measurement',
      'types of sampling',
      'finding probability',
      'finding x from z score',
      'z score',
      'basic set operations',
      'compound events',
      'conditional probability',
      'independent probability',
      'permutations and combinations',
      'random variables distributions',
      'relationships between variables',
      'confidence intervals',
      'interpreting pvalue',
      'finding the test statistic'
    ],
    [MATH_CERTS.PRECALCULUS]: [
      'rectangular coordinates',
      'linear inequalities',
      'functions',
      'rational exponents',
      'quadratic functions',
      'logarithms and exponents'
    ],
    [MATH_CERTS.CALCULUS_AB]: [
      'absolute extrema',
      'antiderivatives',
      'area between curves',
      'chain rule',
      'concavity',
      'continuity',
      'derivatives',
      'differential equations',
      'fundamental theorem',
      'lhopitals rule',
      'implicit differentiation',
      'mean value theorem',
      'optimization',
      'reimann sums',
      'related rates',
      'relative extrema'
    ],
    [MATH_CERTS.CALCULUS_BC]: [
      'absolute extrema',
      'antiderivatives',
      'area between curves',
      'chain rule',
      'derivatives',
      'differential equations',
      'fundamental theorem of calculus',
      'implicit differentiation',
      'infinite sequences',
      'limits',
      'integration by parts',
      'mean value theorem',
      'optimization',
      'parametric',
      'reimann sums',
      'relative extrema',
      'taylor polynomials'
    ],
    [COLLEGE_CERTS.ESSAYS]: [
      'basic',
      'commonapp',
      'answer',
      'dhistory',
      'optional',
      'supplemental'
    ],
    // @note: Once College Counseling is implemented Planning and Applications will be phased to subjects that are unlocked instead of certs
    [COLLEGE_SUBJECTS.PLANNING]: ['exam', 'type', 'LOR', 'basic'],
    [COLLEGE_SUBJECTS.APPLICATIONS]: [
      'timeline',
      'resume',
      'schools',
      'fees',
      'FinAid',
      'LOR',
      'basic'
    ],
    [SCIENCE_CERTS.BIOLOGY]: [
      'biochemistry',
      'the cell',
      'cell division',
      'cellular respiration',
      'photosynthesis and plants',
      'classical genetics',
      'molecular genetics',
      'animal behavior and physiology',
      'ecology',
      'human physiology and anatomy',
      'evolution and taxonomy'
    ],
    [SCIENCE_CERTS.CHEMISTRY]: [
      'chemical reactions',
      'atoms, compounds, and ions',
      'stoichiometry',
      'electron structure of atoms',
      'periodic table',
      'chemical bonds',
      'gases',
      'states of matter and intermolecular forces',
      'chemical equilibrium',
      'acids and bases',
      'buffers, titrations, and solubility equilibria',
      'thermodynamics',
      'redox reactions and electrochemistry',
      'kinetics',
      'nuclear chemistry',
      'kinematics'
    ],
    [SCIENCE_CERTS.PHYSICS_ONE]: [
      'kinematics',
      // eslint-disable-next-line quotes
      "newton's laws",
      'rotational mechanics',
      'work and energy',
      'momentum and collisions',
      'thermodynamics',
      'electrostatics',
      'magnetism',
      'waves and sound',
      'refraction and reflection',
      'gravity/gen relativity'
    ],
    [SCIENCE_CERTS.PHYSICS_TWO]: [
      'Fluids - density and pressure',
      'Fluids - dynamics',
      'THD - Ideal Gases',
      'thermodynamics',
      'Electric Field',
      'Electric Potential',
      'Magnetic Fields',
      'Magnetic Induction',
      'Electromagnetic Waves',
      'Optics - refraction and reflection',
      'Quantum & Atomic Physics',
      'dynamics 2',
      'Electric Circuits'
    ],
    [SCIENCE_CERTS.ENVIRONMENTAL_SCIENCE]: [
      'earth systems and resources',
      'ecology',
      'energy resources and consumption',
      'global change',
      'impact of human health and environment',
      'interdependence of organisms',
      'land and water resources and use',
      'introduction to environmental science',
      'natural biogeochemical cycles',
      'pollution',
      'populations',
      'the atmosphere'
    ],
    [TRAINING.UPCHIEVE_101]: ['upchieve'],
    [SAT_CERTS.SAT_MATH]: [
      'linear_equations',
      'linear_inequalities',
      'linear_functions',
      'quadratic_problems',
      'nonlinear_equations',
      'rational_expressions',
      'isolating_quantities',
      'linear_systems',
      'ratios_rates',
      'units',
      'percentages',
      'linear_and_exponential',
      'data_inferences',
      'volume_word_problems',
      'complex_numbers',
      'circle_equations',
      'table_data',
      'scatterplots',
      'graphs',
      'shape_of_distributions',
      'right_triangle_problems',
      'congruence_and_similarity'
    ],
    [SAT_CERTS.SAT_READING]: [
      'explict_v_implicit',
      'point_of_view',
      'analyzing_relationships',
      'citing_evidence',
      'summarizing',
      'analogical_reasoning',
      'structure_passage',
      'word_choice',
      'graphs_and_data',
      'purpose_of_text',
      'analyzing_arguments',
      'connecting_texts',
      'history_passages',
      'strategies'
    ]
  };

  if (typeof category !== 'string') {
    throw new TypeError(
      'Category has a value of ' +
        category +
        '. It must be a string, not ' +
        typeof category
    );
  }

  if (categoryToSubcategoryMap.hasOwnProperty(category)) {
    const subcategories = categoryToSubcategoryMap[category];
    return subcategories;
  } else {
    throw new ReferenceError(category + ' is not a subcategory.');
  }
};

const QuestionModel = model<QuestionDocument, QuestionStaticModel>(
  'Question',
  questionSchema,
  'question'
);

module.exports = QuestionModel;
export default QuestionModel;
