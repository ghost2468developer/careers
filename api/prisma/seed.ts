import {
  AssessmentType,
  PrismaClient,
  QuestionType,
  Role,
  SubjectCode,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateAchievementLevel, gradeStudentAnswer } from '../src/lib/grading';

const prisma = new PrismaClient();

interface BaseQuestionTemplate {
  topic: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  rubricKeywords: string[];
  explanation: string;
}

interface SubjectGradeCurriculum {
  grade: number;
  subject: SubjectCode;
  examTitle: string;
  examDescription: string;
  pastPaperSource: string;
  quizTitle: string;
  quizDescription: string;
  examQuestions: BaseQuestionTemplate[];
  quizQuestions: BaseQuestionTemplate[];
}

function build10Questions(
  coreQuestions: BaseQuestionTemplate[],
  grade: number,
  subjectLabel: string
): BaseQuestionTemplate[] {
  // If coreQuestions has fewer than 10, expand with curriculum-specific past paper questions so there are strictly 10 questions
  const result = [...coreQuestions];
  const extraTemplates: BaseQuestionTemplate[] = [
    {
      topic: `${subjectLabel} Past Paper - Multiple Choice Analysis`,
      type: QuestionType.MULTIPLE_CHOICE,
      prompt: `[Past Paper Q${result.length + 1} · Grade ${grade} ${subjectLabel}] Which statement best describes the primary principle tested in Section A of the Grade ${grade} ${subjectLabel} National Past Paper?`,
      options: [
        `A) Direct substitution without checking domain or boundary conditions`,
        `B) Applying conservation laws, definitions, and standard Grade ${grade} ${subjectLabel} relationships systematically`,
        `C) Ignoring SI units and rounding off in the very first step`,
        `D) Using only graphical estimation without algebraic or scientific proof`,
      ],
      correctAnswer: `B) Applying conservation laws, definitions, and standard Grade ${grade} ${subjectLabel} relationships systematically`,
      rubricKeywords: ['conservation laws', 'definitions', 'systematically'],
      explanation: `In Grade ${grade} ${subjectLabel} past papers, full marks require stating the governing formula/law, substituting with correct units, and rounding only at the final step.`,
    },
    {
      topic: `${subjectLabel} Past Paper - Quantitative Calculation`,
      type: QuestionType.NUMERIC,
      prompt: `[Past Paper Q${result.length + 2} · Grade ${grade} ${subjectLabel}] In a structured past paper calculation, a quantity increases from 40 units to 50 units over a standard interval. Calculate the percentage increase (enter the numerical value without the % sign).`,
      options: [],
      correctAnswer: '25',
      rubricKeywords: ['25', '(50 - 40) / 40 * 100', '10 / 40'],
      explanation:
        'Percentage increase = ((Final - Initial) / Initial) × 100 = ((50 - 40) / 40) × 100 = (10 / 40) × 100 = 25%.',
    },
    {
      topic: `${subjectLabel} Past Paper - Conceptual Verification`,
      type: QuestionType.TRUE_FALSE,
      prompt: `[Past Paper Q${result.length + 3} · Grade ${grade} ${subjectLabel}] In an official CAPS Grade ${grade} ${subjectLabel} examination, showing the correct formula and substitution earns method marks even if a minor arithmetic slip occurs in the final line.`,
      options: ['True', 'False'],
      correctAnswer: 'True',
      rubricKeywords: ['True', 'formula', 'substitution', 'method marks'],
      explanation:
        'True! Official NSC/CAPS marking memorandums award method marks (✓ formula, ✓ substitution) before the final accuracy mark.',
    },
    {
      topic: `${subjectLabel} Past Paper - Structured Rate & Ratio Problem`,
      type: QuestionType.NUMERIC,
      prompt: `[Past Paper Q${result.length + 4} · Grade ${grade} ${subjectLabel}] Given the linear past-paper relation 4x - 8 = 12, solve for the numerical value of x.`,
      options: [],
      correctAnswer: '5',
      rubricKeywords: ['5', '4x = 20', '20 / 4'],
      explanation:
        'Step 1: Add 8 to both sides: 4x = 20. Step 2: Divide both sides by 4: x = 5.',
    },
    {
      topic: `${subjectLabel} Past Paper - Data & Graph Interpretation`,
      type: QuestionType.MULTIPLE_CHOICE,
      prompt: `[Past Paper Q${result.length + 5} · Grade ${grade} ${subjectLabel}] When plotting experimental or statistical data on a Cartesian graph in Grade ${grade} ${subjectLabel}, where is the independent variable plotted?`,
      options: [
        'A) On the vertical y-axis',
        'B) On the horizontal x-axis',
        'C) Only in the legend',
        'D) At the origin (0; 0) only',
      ],
      correctAnswer: 'B) On the horizontal x-axis',
      rubricKeywords: ['horizontal x-axis', 'independent variable'],
      explanation:
        'By scientific and mathematical convention, the independent variable (controlled input) is plotted on the horizontal x-axis and the dependent variable (measured output) on the vertical y-axis.',
    },
    {
      topic: `${subjectLabel} Past Paper - Multi-Step Ratio Calculation`,
      type: QuestionType.NUMERIC,
      prompt: `[Past Paper Q${result.length + 6} · Grade ${grade} ${subjectLabel}] A total of 180 marks is divided in the ratio 2 : 3 between Section A and Section B. Calculate the number of marks allocated to Section B.`,
      options: [],
      correctAnswer: '108',
      rubricKeywords: ['108', '3/5 * 180', '180 / 5 = 36'],
      explanation:
        'Total parts = 2 + 3 = 5 parts. Section B = (3 / 5) × 180 = 3 × 36 = 108 marks.',
    },
    {
      topic: `${subjectLabel} Past Paper - Long-Answer Synthesis & Explain`,
      type: QuestionType.EXPLAIN,
      prompt: `[Past Paper Q${result.length + 7} · Grade ${grade} ${subjectLabel}] Explain why stating clear definitions, writing down the governing formula/principle, and showing all intermediate steps are critical when answering structured long-answer questions in Grade ${grade} ${subjectLabel}.`,
      options: [],
      correctAnswer:
        'Stating the exact definition and formula establishes the scientific or mathematical principle being applied, while showing intermediate substitution steps allows markers to award method marks and verify logical reasoning.',
      rubricKeywords: [
        'definition',
        'formula',
        'substitution',
        'method marks',
        'logical reasoning',
      ],
      explanation:
        'Marking Rubric: ✓ Stating the exact definition/law. ✓ Writing the standard formula. ✓ Showing clear substitution steps for method marks. ✓ Logical conclusion.',
    },
  ];

  let i = 0;
  while (result.length < 10) {
    const tmpl = extraTemplates[i % extraTemplates.length];
    result.push({
      ...tmpl,
      prompt: tmpl.prompt.replace(
        /\[Past Paper Q\d+/,
        `[Past Paper Q${result.length + 1}`
      ),
    });
    i++;
  }

  return result.slice(0, 10);
}

const CURRICULUM_DATA: Array<{
  grade: number;
  subject: SubjectCode;
  subjectLabel: string;
  examTitle: string;
  pastPaperSource: string;
  quizTitle: string;
  coreQuestions: BaseQuestionTemplate[];
}> = [
  // ==========================================================================
  // GRADE 10 (5 SUBJECTS)
  // ==========================================================================
  {
    grade: 10,
    subject: SubjectCode.MATHEMATICS,
    subjectLabel: 'Mathematics',
    examTitle: 'Grade 10 Mathematics Past Paper 1: Algebra, Equations, Functions & Trigonometry',
    pastPaperSource: 'DBE CAPS Grade 10 November Past Paper 1 (150 Marks · 10 Questions)',
    quizTitle: 'Grade 10 Mathematics Revision Quiz: Algebraic Expressions & Functions (100 Marks)',
    coreQuestions: [
      {
        topic: 'Algebraic Factorisation',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Fully factorise the algebraic expression: 2x² - 18',
        options: [
          'A) 2(x - 9)(x + 9)',
          'B) 2(x - 3)(x + 3)',
          'C) (2x - 6)(x + 3)',
          'D) 2(x - 3)²',
        ],
        correctAnswer: 'B) 2(x - 3)(x + 3)',
        rubricKeywords: ['2(x - 3)(x + 3)', 'difference of two squares'],
        explanation:
          'Take out common factor 2: 2(x² - 9). Then factorise the difference of squares: 2(x - 3)(x + 3).',
      },
      {
        topic: 'Exponential Equations',
        type: QuestionType.NUMERIC,
        prompt: 'Solve for x: 3^(x + 1) = 81. Enter the numerical value of x.',
        options: [],
        correctAnswer: '3',
        rubricKeywords: ['3', '3^4', 'x + 1 = 4'],
        explanation: 'Write 81 as 3⁴. Then x + 1 = 4, which gives x = 3.',
      },
      {
        topic: 'Quadratic Turning Points',
        type: QuestionType.TRUE_FALSE,
        prompt: 'For the parabola f(x) = -2x² + 8, the turning point at (0; 8) is a minimum value.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        rubricKeywords: ['False', 'maximum'],
        explanation: 'Since a = -2 < 0, the parabola opens downwards and has a maximum turning point at (0; 8).',
      },
      {
        topic: 'Perpendicular Gradients Proof',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain why two perpendicular straight lines on the Cartesian plane cannot both have positive gradients, and state the equation relating their gradients m₁ and m₂.',
        options: [],
        correctAnswer:
          'The product of the gradients of two perpendicular lines is -1 (m₁ × m₂ = -1). Since their product is negative, one line must have a positive gradient and the other must have a negative gradient.',
        rubricKeywords: ['product', '-1', 'm1 * m2 = -1', 'positive', 'negative'],
        explanation:
          'Perpendicular lines satisfy m₁ × m₂ = -1. Two positive numbers cannot multiply to give -1, so one gradient is positive and the other is negative.',
      },
    ],
  },
  {
    grade: 10,
    subject: SubjectCode.MATHEMATICAL_LITERACY,
    subjectLabel: 'Mathematical Literacy',
    examTitle: 'Grade 10 Mathematical Literacy Past Paper: Finance, Tariffs, VAT & Measurement',
    pastPaperSource: 'DBE CAPS Grade 10 November Past Paper (150 Marks · 10 Questions)',
    quizTitle: 'Grade 10 Mathematical Literacy Quiz: Consumer Tariffs & Budgets (100 Marks)',
    coreQuestions: [
      {
        topic: 'VAT Calculations (15%)',
        type: QuestionType.NUMERIC,
        prompt:
          'A scientific calculator costs R400 excluding VAT. Calculate the final selling price including 15% VAT (in Rands).',
        options: [],
        correctAnswer: '460',
        rubricKeywords: ['460', 'R460', '400 * 1.15'],
        explanation: '15% of R400 = R60. Total price including VAT = R400 + R60 = R460.',
      },
      {
        topic: 'Map Ratio Scales',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'What does a number scale of 1 : 50 000 on a topographic map mean?',
        options: [
          'A) 1 cm on the map represents 50 000 km in reality',
          'B) 1 unit on the map represents 50 000 of the same units on the ground',
          'C) 50 000 cm on the map represents 1 cm in reality',
          'D) The map is 50 000 times larger than reality',
        ],
        correctAnswer: 'B) 1 unit on the map represents 50 000 of the same units on the ground',
        rubricKeywords: ['same units', '50 000'],
        explanation: '1 unit on the map represents 50 000 of the exact same units in reality.',
      },
      {
        topic: 'Stepped Water Tariffs',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain why South African municipalities use a stepped (sliding-scale) tariff system for household water consumption.',
        options: [],
        correctAnswer:
          'Municipalities use stepped tariffs to keep essential basic water affordable for low-usage households while charging higher rates to high-volume users to discourage water wastage and promote conservation.',
        rubricKeywords: ['affordable', 'basic water', 'discourage wastage', 'conservation', 'high usage'],
        explanation:
          'Stepped tariffs subsidize basic water needs while penalizing excessive consumption to conserve scarce water resources.',
      },
    ],
  },
  {
    grade: 10,
    subject: SubjectCode.PHYSICAL_SCIENCES,
    subjectLabel: 'Physical Sciences',
    examTitle: 'Grade 10 Physical Sciences Past Paper: Waves, Sound, Light & Atomic Structure',
    pastPaperSource: 'DBE CAPS Grade 10 November Past Paper 1 & 2 (150 Marks · 10 Questions)',
    quizTitle: 'Grade 10 Physical Sciences Quiz: Wave Equation & Isotopes (100 Marks)',
    coreQuestions: [
      {
        topic: 'Wave Speed Calculation',
        type: QuestionType.NUMERIC,
        prompt:
          'A water wave has a frequency of 5 Hz and a wavelength of 2.4 m. Calculate the speed of the wave in m/s.',
        options: [],
        correctAnswer: '12',
        rubricKeywords: ['12', 'v = f * lambda', '5 * 2.4'],
        explanation: 'v = f × λ = 5 Hz × 2.4 m = 12 m/s.',
      },
      {
        topic: 'Isotopes & Atomic Structure',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Isotopes of the same chemical element always have:',
        options: [
          'A) The same mass number but different atomic numbers',
          'B) The same number of protons but different numbers of neutrons',
          'C) The same number of neutrons but different numbers of electrons',
          'D) Completely different chemical symbols',
        ],
        correctAnswer: 'B) The same number of protons but different numbers of neutrons',
        rubricKeywords: ['same number of protons', 'different numbers of neutrons'],
        explanation:
          'Isotopes have the same atomic number (protons) but different mass numbers due to different neutron counts.',
      },
      {
        topic: 'Transverse vs Longitudinal Waves',
        type: QuestionType.EXPLAIN,
        prompt:
          'Distinguish between a transverse wave and a longitudinal wave in terms of particle vibration direction relative to wave propagation.',
        options: [],
        correctAnswer:
          'In a transverse wave, particles of the medium vibrate perpendicular to the direction of wave propagation. In a longitudinal wave, particles vibrate parallel to the direction of wave propagation.',
        rubricKeywords: ['perpendicular', 'parallel', 'direction of propagation', 'particles vibrate'],
        explanation:
          'Transverse waves have perpendicular particle motion (90°), whereas longitudinal waves have parallel particle motion.',
      },
    ],
  },
  {
    grade: 10,
    subject: SubjectCode.LIFE_SCIENCES,
    subjectLabel: 'Life Sciences',
    examTitle: 'Grade 10 Life Sciences Past Paper: Cell Organelles, Mitosis & Plant Transpiration',
    pastPaperSource: 'DBE CAPS Grade 10 November Past Paper (150 Marks · 10 Questions)',
    quizTitle: 'Grade 10 Life Sciences Quiz: Cells, Mitosis & Tissues (100 Marks)',
    coreQuestions: [
      {
        topic: 'Cell Organelles & ATP',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Which cell organelle is the site of cellular respiration and ATP production?',
        options: ['A) Chloroplast', 'B) Ribosome', 'C) Mitochondrion', 'D) Nucleus'],
        correctAnswer: 'C) Mitochondrion',
        rubricKeywords: ['Mitochondrion', 'ATP'],
        explanation: 'Mitochondria carry out aerobic cellular respiration to release ATP energy.',
      },
      {
        topic: 'Xylem Structure & Transport',
        type: QuestionType.TRUE_FALSE,
        prompt: 'Xylem vessels transport water and dissolved mineral salts upwards from roots to leaves.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'xylem'],
        explanation: 'True! Xylem transports water and mineral ions upward from the root system.',
      },
      {
        topic: 'Biological Importance of Mitosis',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain the biological importance of mitosis in multicellular organisms and describe chromosome alignment during Metaphase.',
        options: [],
        correctAnswer:
          'Mitosis enables growth, repair and replacement of damaged tissues, and produces genetically identical daughter cells. During Metaphase, chromosomes line up along the equator of the cell attached to spindle fibres.',
        rubricKeywords: ['growth', 'repair', 'genetically identical', 'equator', 'spindle fibres'],
        explanation:
          'Mitosis ensures genetically identical cells for growth and tissue repair, with equatorial chromosome alignment in Metaphase.',
      },
    ],
  },
  {
    grade: 10,
    subject: SubjectCode.GEOGRAPHY,
    subjectLabel: 'Geography',
    examTitle: 'Grade 10 Geography Past Paper: Atmosphere, Climatology, Plate Tectonics & Water',
    pastPaperSource: 'DBE CAPS Grade 10 November Past Paper (150 Marks · 10 Questions)',
    quizTitle: 'Grade 10 Geography Quiz: Atmospheric Layers & Relief Rainfall (100 Marks)',
    coreQuestions: [
      {
        topic: 'Atmospheric Layers',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'In which atmospheric layer do almost all weather phenomena occur?',
        options: ['A) Stratosphere', 'B) Troposphere', 'C) Mesosphere', 'D) Thermosphere'],
        correctAnswer: 'B) Troposphere',
        rubricKeywords: ['Troposphere', 'weather'],
        explanation: 'The troposphere contains most water vapour and aerosols where weather occurs.',
      },
      {
        topic: 'Stratospheric Ozone',
        type: QuestionType.TRUE_FALSE,
        prompt: 'The ozone layer that absorbs harmful UV radiation is located in the Stratosphere.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'Stratosphere'],
        explanation: 'True! Stratospheric ozone filters out harmful solar ultraviolet radiation.',
      },
      {
        topic: 'Orographic (Relief) Rainfall & Rain Shadow',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain how relief (orographic) rainfall develops on the windward slope of a coastal mountain and why a dry rain shadow forms on the leeward side.',
        options: [],
        correctAnswer:
          'Warm moist air is forced to rise up the windward slope, cools adiabatically to dew point, and condenses to form clouds and rain. Descending air on the leeward side warms up and absorbs moisture, creating a dry rain shadow.',
        rubricKeywords: ['windward', 'forced to rise', 'cools', 'condensation', 'leeward', 'descends'],
        explanation:
          'Rising air on the windward slope cools and condenses into rain, while descending air on the leeward slope warms adiabatically.',
      },
    ],
  },

  // ==========================================================================
  // GRADE 11 (5 SUBJECTS)
  // ==========================================================================
  {
    grade: 11,
    subject: SubjectCode.MATHEMATICS,
    subjectLabel: 'Mathematics',
    examTitle: 'Grade 11 Mathematics Past Paper: Nature of Roots, Trigonometry & Euclidean Geometry',
    pastPaperSource: 'DBE CAPS Grade 11 November Past Paper 1 & 2 (150 Marks · 10 Questions)',
    quizTitle: 'Grade 11 Mathematics Quiz: Quadratic Discriminant & Circle Theorems (100 Marks)',
    coreQuestions: [
      {
        topic: 'Nature of Roots (Discriminant)',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'If Δ = b² - 4ac = 25 for a quadratic equation with rational coefficients, the roots are:',
        options: [
          'A) Non-real',
          'B) Real, rational, and equal',
          'C) Real, rational, and unequal',
          'D) Real, irrational, and unequal',
        ],
        correctAnswer: 'C) Real, rational, and unequal',
        rubricKeywords: ['Real, rational, and unequal', 'perfect square'],
        explanation: 'Since Δ = 25 > 0 is a perfect square, the roots are real, rational, and unequal.',
      },
      {
        topic: 'Circle Geometry - Angle at Centre',
        type: QuestionType.NUMERIC,
        prompt:
          'Chord AB subtends ∠AOB = 116° at the centre O of a circle. Calculate ∠ACB at the circumference (in degrees).',
        options: [],
        correctAnswer: '58',
        rubricKeywords: ['58', '116 / 2'],
        explanation: 'Angle at centre = 2 × angle at circumference, so ∠ACB = 116° ÷ 2 = 58°.',
      },
      {
        topic: 'Trigonometric Identities & Restrictions',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain how to prove tan θ × cos θ = sin θ and state the values of θ in [0°; 360°] where the identity is undefined.',
        options: [],
        correctAnswer:
          'Substitute tan θ = sin θ / cos θ on the LHS to get (sin θ / cos θ) × cos θ, then cancel cos θ to obtain sin θ. It is undefined where cos θ = 0, namely θ = 90° and θ = 270°.',
        rubricKeywords: ['sin', 'cos', 'cancel', '90', '270'],
        explanation: 'Using tan θ = sin θ / cos θ and cancelling cos θ proves the identity; cos θ = 0 at 90° and 270°.',
      },
    ],
  },
  {
    grade: 11,
    subject: SubjectCode.MATHEMATICAL_LITERACY,
    subjectLabel: 'Mathematical Literacy',
    examTitle: 'Grade 11 Mathematical Literacy Past Paper: Compound Interest, Inflation & Break-Even',
    pastPaperSource: 'DBE CAPS Grade 11 November Past Paper (150 Marks · 10 Questions)',
    quizTitle: 'Grade 11 Mathematical Literacy Quiz: Break-Even & Inflation Analysis (100 Marks)',
    coreQuestions: [
      {
        topic: 'Break-Even Point',
        type: QuestionType.NUMERIC,
        prompt:
          'Muffins sell for R20 each. Fixed costs are R300 and variable cost is R8 per muffin. How many muffins must be sold to break even?',
        options: [],
        correctAnswer: '25',
        rubricKeywords: ['25', '300 / 12'],
        explanation: 'Contribution per unit = R20 - R8 = R12. Break-even = 300 ÷ 12 = 25 muffins.',
      },
      {
        topic: 'Inflation Rate Interpretation',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'If annual inflation drops from 6.5% to 5.0%, what happens to general prices?',
        options: [
          'A) Prices decrease by 1.5%',
          'B) Prices remain unchanged',
          'C) Prices still increase, but at a slower rate of 5.0%',
          'D) Goods cost less than the previous year',
        ],
        correctAnswer: 'C) Prices still increase, but at a slower rate of 5.0%',
        rubricKeywords: ['still increase', 'slower rate'],
        explanation: 'Positive inflation means prices still rise, just at a slower pace.',
      },
      {
        topic: 'Simple vs Compound Interest',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain the difference between Simple Interest and Compound Interest over a multi-year investment.',
        options: [],
        correctAnswer:
          'Simple interest is calculated only on the original principal each year, whereas compound interest is calculated on the principal plus accumulated interest from previous periods, yielding higher returns.',
        rubricKeywords: ['original principal', 'accumulated interest', 'interest on interest', 'compound interest', 'higher'],
        explanation: 'Compound interest earns interest on previously accumulated interest.',
      },
    ],
  },
  {
    grade: 11,
    subject: SubjectCode.PHYSICAL_SCIENCES,
    subjectLabel: 'Physical Sciences',
    examTitle: 'Grade 11 Physical Sciences Past Paper: Newtons Laws, Electrostatics & Intermolecular Forces',
    pastPaperSource: 'DBE CAPS Grade 11 November Past Paper 1 & 2 (150 Marks · 10 Questions)',
    quizTitle: 'Grade 11 Physical Sciences Quiz: Dynamics, Coulombs Law & Bonding (100 Marks)',
    coreQuestions: [
      {
        topic: "Newton's Second Law",
        type: QuestionType.NUMERIC,
        prompt:
          'A 50 N horizontal force pulls a 10 kg block across a rough surface with 14 N kinetic friction. Calculate the acceleration in m/s².',
        options: [],
        correctAnswer: '3.6',
        rubricKeywords: ['3.6', '36 / 10', 'Fnet = ma'],
        explanation: 'F_net = 50 - 14 = 36 N. Acceleration a = F_net / m = 36 / 10 = 3.6 m/s².',
      },
      {
        topic: "Coulomb's Law Inverse-Square",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'Two point charges exert force F at distance r. If the distance is doubled to 2r, the new force is:',
        options: ['A) 2F', 'B) 4F', 'C) F/2', 'D) F/4'],
        correctAnswer: 'D) F/4',
        rubricKeywords: ['F/4'],
        explanation: 'Since F ∝ 1/r², doubling r reduces the force to F / 2² = F/4.',
      },
      {
        topic: 'Intermolecular Forces & Boiling Points',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain why H₂O has a much higher boiling point (100°C) than H₂S (-60°C) in terms of intermolecular forces.',
        options: [],
        correctAnswer:
          'H₂O molecules form strong hydrogen bonds whereas H₂S molecules only have weaker dipole-dipole forces. More thermal energy is required to overcome the stronger hydrogen bonds in H₂O.',
        rubricKeywords: ['hydrogen bonds', 'dipole-dipole', 'stronger intermolecular forces', 'more energy', 'overcome'],
        explanation: 'Hydrogen bonding in water is significantly stronger than dipole-dipole forces in H₂S.',
      },
    ],
  },
  {
    grade: 11,
    subject: SubjectCode.LIFE_SCIENCES,
    subjectLabel: 'Life Sciences',
    examTitle: 'Grade 11 Life Sciences Past Paper: Photosynthesis, Cellular Respiration & Gas Exchange',
    pastPaperSource: 'DBE CAPS Grade 11 November Past Paper (150 Marks · 10 Questions)',
    quizTitle: 'Grade 11 Life Sciences Quiz: Chloroplasts, Alveoli & Excretion (100 Marks)',
    coreQuestions: [
      {
        topic: 'Photosynthesis - Calvin Cycle',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Where in the chloroplast does the light-independent phase of photosynthesis occur?',
        options: ['A) Grana', 'B) Stroma', 'C) Cristae', 'D) Cytoplasm'],
        correctAnswer: 'B) Stroma',
        rubricKeywords: ['Stroma'],
        explanation: 'The light-independent reactions take place in the enzyme-rich stroma.',
      },
      {
        topic: 'Mechanism of Inhalation',
        type: QuestionType.TRUE_FALSE,
        prompt:
          'During inhalation, the diaphragm contracts and flattens while thoracic cavity volume increases.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'diaphragm contracts'],
        explanation: 'True! Diaphragm contraction increases thoracic volume and lowers lung pressure.',
      },
      {
        topic: 'Adaptations of Alveoli for Gas Exchange',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain FOUR structural adaptations of human alveoli that make them efficient gas exchange surfaces.',
        options: [],
        correctAnswer:
          'Alveoli provide a large surface area, have walls a single layer of squamous epithelium thick for rapid diffusion, are lined with moisture to dissolve gases, and are surrounded by a dense capillary network to maintain a diffusion gradient.',
        rubricKeywords: ['large surface area', 'single layer', 'moisture', 'capillaries', 'diffusion gradient'],
        explanation:
          'Large surface area, one-cell-thick squamous walls, moist lining, and rich capillary supply maximize gas exchange.',
      },
    ],
  },
  {
    grade: 11,
    subject: SubjectCode.GEOGRAPHY,
    subjectLabel: 'Geography',
    examTitle: 'Grade 11 Geography Past Paper: Global Air Circulation, El Niño & Slope Geomorphology',
    pastPaperSource: 'DBE CAPS Grade 11 November Past Paper (150 Marks · 10 Questions)',
    quizTitle: 'Grade 11 Geography Quiz: Coriolis Force, El Niño & Slopes (100 Marks)',
    coreQuestions: [
      {
        topic: 'Coriolis Force Deflection',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'In the Southern Hemisphere, the Coriolis force deflects winds to the:',
        options: [
          'A) Right of their intended path',
          'B) Left of their intended path',
          'C) Directly along isobars',
          'D) Towards the poles only',
        ],
        correctAnswer: 'B) Left of their intended path',
        rubricKeywords: ['Left'],
        explanation: 'Ferrel’s Law states winds deflect to the left in the Southern Hemisphere.',
      },
      {
        topic: 'Talus (Scree) Slope Element',
        type: QuestionType.TRUE_FALSE,
        prompt:
          'The talus slope lies below the cliff (free-face) and maintains a constant angle as debris collects.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'talus'],
        explanation: 'True! Weathered rock debris accumulates on the talus slope at a uniform angle.',
      },
      {
        topic: 'El Niño Impact on Southern Africa',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain how an El Niño event causes drought conditions and reduced agricultural crop yields in Southern Africa.',
        options: [],
        correctAnswer:
          'During El Niño, trade winds weaken and warm water shifts east in the Pacific, causing high pressure and subsiding dry air over Southern Africa, which leads to drought and reduced crop yields.',
        rubricKeywords: ['trade winds weaken', 'high pressure', 'subsiding air', 'drought', 'crop yields'],
        explanation:
          'Subsiding air under high pressure suppresses convection and rainfall across Southern Africa during El Niño.',
      },
    ],
  },

  // ==========================================================================
  // GRADE 12 MATRIC (5 SUBJECTS)
  // ==========================================================================
  {
    grade: 12,
    subject: SubjectCode.MATHEMATICS,
    subjectLabel: 'Mathematics',
    examTitle: 'Grade 12 Matric Mathematics Past Paper 1: Calculus, Sequences, Series & Finance',
    pastPaperSource: 'DBE NSC Grade 12 Matric November Past Paper 1 (150 Marks · 10 Questions)',
    quizTitle: 'Grade 12 Matric Mathematics Quiz: Derivatives & Convergent Series (100 Marks)',
    coreQuestions: [
      {
        topic: 'Differential Calculus - Stationary Points',
        type: QuestionType.NUMERIC,
        prompt:
          'For the cubic function f(x) = x³ - 6x² + 9x + 2, calculate the smaller x-coordinate of the turning points where f\'(x) = 0.',
        options: [],
        correctAnswer: '1',
        rubricKeywords: ['1', '3x^2 - 12x + 9 = 0'],
        explanation: 'f\'(x) = 3x² - 12x + 9 = 3(x - 1)(x - 3) = 0. The smaller x-value is 1.',
      },
      {
        topic: 'Convergent Geometric Series',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'For which values of x does 2 + 2(x - 1) + 2(x - 1)² + ... converge?',
        options: ['A) -1 < x < 1', 'B) 0 < x < 2', 'C) x > 2', 'D) -2 < x < 2'],
        correctAnswer: 'B) 0 < x < 2',
        rubricKeywords: ['0 < x < 2', '-1 < r < 1'],
        explanation: 'Series converges when -1 < r < 1 → -1 < x - 1 < 1 → 0 < x < 2.',
      },
      {
        topic: 'Cubic Point of Inflection',
        type: QuestionType.TRUE_FALSE,
        prompt: 'At the point of inflection of a cubic graph f(x), the second derivative f\'\'(x) = 0.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'second derivative'],
        explanation: 'True! Concavity changes at the point of inflection where f\'\'(x) = 0.',
      },
      {
        topic: 'Calculus Optimization & Second Derivative Test',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain why we set f\'(x) = 0 when finding a maximum in Matric Calculus optimization and how f\'\'(x) confirms a local maximum.',
        options: [],
        correctAnswer:
          'f\'(x) is the rate of change or gradient of the tangent, which is horizontal (0) at a turning point. If f\'\'(x) < 0, the graph is concave down, confirming a local maximum.',
        rubricKeywords: ['gradient of tangent', 'horizontal', 'rate of change', 'f\'\'(x) < 0', 'concave down'],
        explanation: 'Horizontal tangent gives f\'(x) = 0, and negative second derivative f\'\'(x) < 0 proves concave-down maximum.',
      },
    ],
  },
  {
    grade: 12,
    subject: SubjectCode.MATHEMATICAL_LITERACY,
    subjectLabel: 'Mathematical Literacy',
    examTitle: 'Grade 12 Matric Mathematical Literacy Past Paper: SARS Tax, Loans & Quartiles',
    pastPaperSource: 'DBE NSC Grade 12 Matric November Past Paper (150 Marks · 10 Questions)',
    quizTitle: 'Grade 12 Matric Mathematical Literacy Quiz: Tax Rebates & IQR (100 Marks)',
    coreQuestions: [
      {
        topic: 'Interquartile Range (IQR)',
        type: QuestionType.NUMERIC,
        prompt: 'Given lower quartile Q₁ = 48 and upper quartile Q₃ = 79, calculate the IQR.',
        options: [],
        correctAnswer: '31',
        rubricKeywords: ['31', '79 - 48'],
        explanation: 'IQR = Q₃ - Q₁ = 79 - 48 = 31.',
      },
      {
        topic: 'Percentile Interpretation',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Scoring at the 85th percentile in a national exam cohort means:',
        options: [
          'A) Scoring 85% on the paper',
          'B) 85% of candidates scored equal to or lower than this learner',
          'C) 85% of candidates scored higher',
          'D) Answering 85 questions',
        ],
        correctAnswer: 'B) 85% of candidates scored equal to or lower than this learner',
        rubricKeywords: ['85% of candidates', 'lower'],
        explanation: '85th percentile means performing better than or equal to 85% of the group.',
      },
      {
        topic: 'SARS Tax Deductions vs Tax Rebates',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain the difference between a tax deduction (such as pension contributions) and a tax rebate when calculating annual SARS income tax.',
        options: [],
        correctAnswer:
          'A tax deduction is subtracted from gross income before applying the tax bracket to find taxable income, whereas a tax rebate is subtracted directly from the calculated tax payable.',
        rubricKeywords: ['taxable income', 'subtracted from gross income', 'before tax bracket', 'tax rebate', 'subtracted from tax payable'],
        explanation: 'Deductions lower taxable income before bracket lookup; rebates reduce tax payable afterwards.',
      },
    ],
  },
  {
    grade: 12,
    subject: SubjectCode.PHYSICAL_SCIENCES,
    subjectLabel: 'Physical Sciences',
    examTitle: 'Grade 12 Matric Physical Sciences Past Paper: Momentum, Doppler & Chemical Equilibrium',
    pastPaperSource: 'DBE NSC Grade 12 Matric November Past Paper 1 & 2 (150 Marks · 10 Questions)',
    quizTitle: 'Grade 12 Matric Physical Sciences Quiz: Impulse, Doppler & Le Chatelier (100 Marks)',
    coreQuestions: [
      {
        topic: 'Impulse & Change in Momentum',
        type: QuestionType.NUMERIC,
        prompt:
          'A 0.5 kg ball moving east at 10 m/s is kicked so it moves west at 14 m/s. Calculate the magnitude of the impulse in N·s.',
        options: [],
        correctAnswer: '12',
        rubricKeywords: ['12', '0.5(-14 - 10)'],
        explanation: 'Δp = m(v_f - v_i) = 0.5(-14 - 10) = -12 N·s. Magnitude = 12 N·s.',
      },
      {
        topic: 'Doppler Effect Receding Source',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'When a siren moves AWAY from a stationary listener, the observed sound has:',
        options: [
          'A) Higher frequency and shorter wavelength',
          'B) Lower frequency and longer wavelength',
          'C) Lower frequency and shorter wavelength',
          'D) Unchanged frequency',
        ],
        correctAnswer: 'B) Lower frequency and longer wavelength',
        rubricKeywords: ['Lower frequency', 'longer wavelength'],
        explanation: 'Receding wave fronts stretch out (longer λ), lowering observed frequency.',
      },
      {
        topic: 'Le Chatelier’s Principle - Haber Process',
        type: QuestionType.EXPLAIN,
        prompt:
          'In N₂(g) + 3H₂(g) ⇌ 2NH₃(g), explain using Le Chatelier’s Principle how increasing pressure affects the equilibrium yield of NH₃.',
        options: [],
        correctAnswer:
          'By Le Chatelier’s Principle, increasing pressure favours the side with fewer moles of gas. There are 4 moles of gas on the left and 2 moles on the right, so the forward reaction is favoured and NH₃ yield increases.',
        rubricKeywords: ['Le Chatelier', 'fewer moles of gas', '4 moles', '2 moles', 'forward reaction favoured'],
        explanation: 'High pressure shifts equilibrium toward 2 moles of product gas vs 4 moles of reactant gas.',
      },
    ],
  },
  {
    grade: 12,
    subject: SubjectCode.LIFE_SCIENCES,
    subjectLabel: 'Life Sciences',
    examTitle: 'Grade 12 Matric Life Sciences Past Paper: DNA, Protein Synthesis, Meiosis & Genetics',
    pastPaperSource: 'DBE NSC Grade 12 Matric November Past Paper 1 & 2 (150 Marks · 10 Questions)',
    quizTitle: 'Grade 12 Matric Life Sciences Quiz: Transcription, Translation & Meiosis (100 Marks)',
    coreQuestions: [
      {
        topic: 'DNA to mRNA Transcription',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'If a DNA template triplet is TAC, what is the complementary mRNA codon?',
        options: ['A) ATG', 'B) AUG', 'C) UAC', 'D) GUA'],
        correctAnswer: 'B) AUG',
        rubricKeywords: ['AUG'],
        explanation: 'T pairs with A, A pairs with U (in RNA), and C pairs with G → AUG.',
      },
      {
        topic: 'Meiosis Haploid Gametes',
        type: QuestionType.NUMERIC,
        prompt:
          'A human body cell has 46 chromosomes. How many chromosomes are in a human gamete after Meiosis II?',
        options: [],
        correctAnswer: '23',
        rubricKeywords: ['23', 'haploid'],
        explanation: 'Meiosis halves the chromosome number from 46 (2n) to 23 (n).',
      },
      {
        topic: 'Protein Synthesis - Translation at Ribosome',
        type: QuestionType.EXPLAIN,
        prompt:
          'Describe the roles of mRNA and tRNA during the translation stage of protein synthesis.',
        options: [],
        correctAnswer:
          'mRNA binds to the ribosome and provides codons specifying the amino acid sequence. tRNA carries specific amino acids to the ribosome with complementary anticodons that pair with mRNA codons so amino acids link by peptide bonds.',
        rubricKeywords: ['ribosome', 'codons', 'anticodon', 'amino acids', 'peptide bonds'],
        explanation: 'mRNA codons pair with tRNA anticodons at the ribosome to join amino acids via peptide bonds.',
      },
    ],
  },
  {
    grade: 12,
    subject: SubjectCode.GEOGRAPHY,
    subjectLabel: 'Geography',
    examTitle: 'Grade 12 Matric Geography Past Paper: Cyclones, River Capture & Urban Settlements',
    pastPaperSource: 'DBE NSC Grade 12 Matric November Past Paper 1 (150 Marks · 10 Questions)',
    quizTitle: 'Grade 12 Matric Geography Quiz: Cold Fronts, Tropical Cyclones & Fluvial Processes (100 Marks)',
    coreQuestions: [
      {
        topic: 'Mid-Latitude Cyclone Cold Front',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Which weather changes occur as a cold front passes over Cape Town?',
        options: [
          'A) Cirrus clouds and rising temperatures',
          'B) Cumulonimbus clouds, sudden drop in temperature, heavy rain, and wind backing',
          'C) Clear skies and zero humidity',
          'D) Tropical cyclone eye subsidence',
        ],
        correctAnswer:
          'B) Cumulonimbus clouds, sudden drop in temperature, heavy rain, and wind backing',
        rubricKeywords: ['Cumulonimbus', 'drop in temperature', 'backing'],
        explanation: 'Cold air uplifts warm air rapidly into cumulonimbus clouds with heavy rain and wind backing.',
      },
      {
        topic: 'Tropical Cyclone Eye Conditions',
        type: QuestionType.TRUE_FALSE,
        prompt: 'In the eye of a mature tropical cyclone, conditions are calm and cloudless due to descending air.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'descending air'],
        explanation: 'True! Subsiding air in the eye warms adiabatically and prevents cloud formation.',
      },
      {
        topic: 'River Capture (Stream Piracy)',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain how headward erosion causes river capture and name the landforms created at the capture point.',
        options: [],
        correctAnswer:
          'An energetic captor stream erodes backwards through the watershed via headward erosion and diverts the headwaters of another river, forming an elbow of capture, a dry wind gap, and leaving a misfit stream.',
        rubricKeywords: ['headward erosion', 'watershed', 'elbow of capture', 'wind gap', 'misfit stream'],
        explanation: 'Headward erosion breaches the watershed, creating an elbow of capture, wind gap, and misfit stream.',
      },
    ],
  },
];

async function main() {
  console.log('Seeding Grade 10–12 Past Paper Exams (150 Marks · 10 Qs) & Quizzes (100 Marks · 10 Qs)...');

  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const userPasswordHash = await bcrypt.hash('User123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Principal N. Mbeki (Admin)',
      role: Role.ADMIN,
      grade: 12,
      isActive: true,
    },
    create: {
      email: 'admin@example.com',
      name: 'Principal N. Mbeki (Admin)',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      grade: 12,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const grade10Learner = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      name: 'Thabo Mokoena (Grade 10 Learner)',
      role: Role.USER,
      grade: 10,
      isActive: true,
    },
    create: {
      email: 'user@example.com',
      name: 'Thabo Mokoena (Grade 10 Learner)',
      passwordHash: userPasswordHash,
      role: Role.USER,
      grade: 10,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const grade11Learner = await prisma.user.upsert({
    where: { email: 'lerato@example.com' },
    update: {
      name: 'Lerato Ndlovu (Grade 11 Learner)',
      role: Role.USER,
      grade: 11,
      isActive: true,
    },
    create: {
      email: 'lerato@example.com',
      name: 'Lerato Ndlovu (Grade 11 Learner)',
      passwordHash: userPasswordHash,
      role: Role.USER,
      grade: 11,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const grade12Learner = await prisma.user.upsert({
    where: { email: 'sipho@example.com' },
    update: {
      name: 'Sipho Dlamini (Grade 12 Matric)',
      role: Role.USER,
      grade: 12,
      isActive: true,
    },
    create: {
      email: 'sipho@example.com',
      name: 'Sipho Dlamini (Grade 12 Matric)',
      passwordHash: userPasswordHash,
      role: Role.USER,
      grade: 12,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  // Seed 15 Past Paper EXAMS (150 Marks · 10 Questions each) + 15 Revision QUIZZES (100 Marks · 10 Questions each)
  const existingCount = await prisma.examPaper.count();
  if (existingCount === 0) {
    for (const item of CURRICULUM_DATA) {
      const tenQuestions = build10Questions(
        item.coreQuestions,
        item.grade,
        item.subjectLabel
      );

      // 1. Create the 150-Mark Past Paper EXAM (10 questions × 15 marks = 150 marks)
      await prisma.examPaper.create({
        data: {
          title: item.examTitle,
          description: `Official Grade ${item.grade} ${item.subjectLabel} Past Paper Examination - 10 structured past-paper questions totaling 150 Marks.`,
          subject: item.subject,
          assessmentType: AssessmentType.EXAM,
          pastPaperSource: item.pastPaperSource,
          grade: item.grade,
          term: 4,
          year: 2026,
          durationMinutes: 150,
          totalMarks: 150,
          isPublished: true,
          createdById: admin.id,
          questions: {
            create: tenQuestions.map((q, idx) => ({
              questionNumber: idx + 1,
              topic: q.topic,
              type: q.type,
              prompt: q.prompt,
              options: q.options,
              correctAnswer: q.correctAnswer,
              rubricKeywords: q.rubricKeywords,
              explanation: q.explanation,
              marks: 15, // 10 questions × 15 marks = 150 marks
            })),
          },
        },
      });

      // 2. Create the 100-Mark Revision QUIZ (10 questions × 10 marks = 100 marks)
      await prisma.examPaper.create({
        data: {
          title: item.quizTitle,
          description: `Grade ${item.grade} ${item.subjectLabel} Interactive Revision Quiz - 10 core questions totaling 100 Marks.`,
          subject: item.subject,
          assessmentType: AssessmentType.QUIZ,
          pastPaperSource: `CAPS Grade ${item.grade} ${item.subjectLabel} Quiz Bank (100 Marks)`,
          grade: item.grade,
          term: 2,
          year: 2026,
          durationMinutes: 60,
          totalMarks: 100,
          isPublished: true,
          createdById: admin.id,
          questions: {
            create: tenQuestions.map((q, idx) => ({
              questionNumber: idx + 1,
              topic: q.topic,
              type: q.type,
              prompt: q.prompt,
              options: q.options,
              correctAnswer: q.correctAnswer,
              rubricKeywords: q.rubricKeywords,
              explanation: q.explanation,
              marks: 10, // 10 questions × 10 marks = 100 marks
            })),
          },
        },
      });
    }
  }

  // Seed sample graded attempts on both 150-mark Exams and 100-mark Quizzes
  const existingAttempts = await prisma.examAttempt.count();
  if (existingAttempts === 0) {
    const allPapers = await prisma.examPaper.findMany({
      include: { questions: true },
    });

    async function seedAttempt(
      learnerId: string,
      paper: (typeof allPapers)[0],
      timeSpentSeconds: number,
      feedback?: string
    ) {
      let scoreEarned = 0;
      let totalMarks = 0;

      const answersPayload = paper.questions.map((q, idx) => {
        const answerText =
          idx === 9 ? '' : q.correctAnswer; // 9 out of 10 right = 90%
        const graded = gradeStudentAnswer(q, answerText);
        scoreEarned += graded.marksEarned;
        totalMarks += graded.maxMarks;

        return {
          questionId: q.id,
          studentAnswer: answerText,
          marksEarned: graded.marksEarned,
          maxMarks: graded.maxMarks,
          isCorrect: graded.isCorrect,
          isPartial: graded.isPartial,
          matchedKeywords: graded.matchedKeywords,
          missedKeywords: graded.missedKeywords,
          gradingFeedback: graded.gradingFeedback,
        };
      });

      const percentage =
        totalMarks > 0 ? Math.round((scoreEarned / totalMarks) * 1000) / 10 : 0;

      await prisma.examAttempt.create({
        data: {
          userId: learnerId,
          examPaperId: paper.id,
          mode: paper.assessmentType,
          scoreEarned,
          totalMarks,
          percentage,
          gradeSymbol: calculateAchievementLevel(percentage),
          timeSpentSeconds,
          teacherFeedback: feedback || null,
          answers: { create: answersPayload },
        },
      });
    }

    const g10Exam = allPapers.find(
      (p) =>
        p.grade === 10 &&
        p.subject === SubjectCode.MATHEMATICS &&
        p.assessmentType === AssessmentType.EXAM
    );
    const g10Quiz = allPapers.find(
      (p) =>
        p.grade === 10 &&
        p.subject === SubjectCode.PHYSICAL_SCIENCES &&
        p.assessmentType === AssessmentType.QUIZ
    );
    const g11Exam = allPapers.find(
      (p) =>
        p.grade === 11 &&
        p.subject === SubjectCode.MATHEMATICS &&
        p.assessmentType === AssessmentType.EXAM
    );
    const g12Exam = allPapers.find(
      (p) =>
        p.grade === 12 &&
        p.subject === SubjectCode.MATHEMATICS &&
        p.assessmentType === AssessmentType.EXAM
    );

    if (g10Exam) {
      await seedAttempt(
        grade10Learner.id,
        g10Exam,
        3200,
        'Excellent 135/150 on the Grade 10 Mathematics Past Paper!'
      );
    }
    if (g10Quiz) {
      await seedAttempt(
        grade10Learner.id,
        g10Quiz,
        1400,
        'Strong 90/100 on the Physical Sciences Quiz!'
      );
    }
    if (g11Exam) {
      await seedAttempt(
        grade11Learner.id,
        g11Exam,
        3600,
        'Great performance (135/150) on Grade 11 Maths Past Paper!'
      );
    }
    if (g12Exam) {
      await seedAttempt(
        grade12Learner.id,
        g12Exam,
        4100,
        'Outstanding Matric readiness (135/150) on Past Paper 1!'
      );
    }
  }

  console.log('Seeded 15 Past Paper Exams (150 Marks, 10 Qs) + 15 Quizzes (100 Marks, 10 Qs)!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
