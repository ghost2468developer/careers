import { PrismaClient, QuestionType, Role, SubjectCode } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateAchievementLevel, gradeStudentAnswer } from '../src/lib/grading';

const prisma = new PrismaClient();

interface SeedQuestion {
  questionNumber: number;
  topic: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  rubricKeywords: string[];
  explanation: string;
  marks: number;
}

interface SeedPaper {
  title: string;
  description: string;
  subject: SubjectCode;
  grade: number;
  term: number;
  year: number;
  durationMinutes: number;
  questions: SeedQuestion[];
}

const EXAM_PAPERS_SEED: SeedPaper[] = [
  // ============================================================================
  // GRADE 10 PAPERS (5 SUBJECTS)
  // ============================================================================
  {
    title: 'Grade 10 Mathematics: Algebra, Equations & Linear Functions',
    description:
      'CAPS Grade 10 exam preparation covering factorization, exponent laws, linear/quadratic equations, and straight-line/parabola graphs.',
    subject: SubjectCode.MATHEMATICS,
    grade: 10,
    term: 2,
    year: 2026,
    durationMinutes: 45,
    questions: [
      {
        questionNumber: 1,
        topic: 'Algebraic Products & Factorisation',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Fully factorise the expression: 2x² - 18',
        options: [
          'A) 2(x - 9)(x + 9)',
          'B) 2(x - 3)(x + 3)',
          'C) (2x - 6)(x + 3)',
          'D) 2(x - 3)²',
        ],
        correctAnswer: 'B) 2(x - 3)(x + 3)',
        rubricKeywords: ['2(x - 3)(x + 3)', 'difference of two squares'],
        explanation:
          'Step 1: Take out the highest common factor (HCF) of 2: 2(x² - 9). Step 2: Factorise the difference of two squares (x² - 9) into (x - 3)(x + 3). Final answer: 2(x - 3)(x + 3).',
        marks: 2,
      },
      {
        questionNumber: 2,
        topic: 'Exponents & Equations',
        type: QuestionType.NUMERIC,
        prompt: 'Solve for x: 3^(x + 1) = 81. Enter the numerical value of x.',
        options: [],
        correctAnswer: '3',
        rubricKeywords: ['3^4', 'x + 1 = 4', 'x = 3'],
        explanation:
          'Step 1: Express 81 as a power of base 3: 81 = 3⁴. Step 2: Equate exponents since bases are equal: x + 1 = 4. Step 3: Subtract 1 on both sides: x = 3.',
        marks: 3,
      },
      {
        questionNumber: 3,
        topic: 'Properties of Functions',
        type: QuestionType.TRUE_FALSE,
        prompt:
          'For the parabola f(x) = -2x² + 8, the turning point is a minimum value at (0; 8).',
        options: ['True', 'False'],
        correctAnswer: 'False',
        rubricKeywords: ['False', 'maximum'],
        explanation:
          'False! Because the coefficient of x² is negative (a = -2 < 0), the parabola opens downwards (sad face) and therefore has a MAXIMUM turning point at (0; 8), not a minimum.',
        marks: 2,
      },
      {
        questionNumber: 4,
        topic: 'Analytical Reasoning in Functions',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain why two perpendicular straight lines on the Cartesian plane cannot both have positive gradients, and state the mathematical relationship between their gradients m₁ and m₂.',
        options: [],
        correctAnswer:
          'The product of the gradients of two perpendicular lines is equal to -1 (m₁ × m₂ = -1). Because their product is negative (-1), one line must have a positive gradient (sloping upwards) and the other must have a negative gradient (sloping downwards).',
        rubricKeywords: [
          'product',
          '-1',
          'm1 * m2 = -1',
          'positive',
          'negative',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: Stating that perpendicular gradients multiply to -1 (m₁ × m₂ = -1). ✓ 1 mark: Noting that a negative product requires opposite signs. ✓ 1 mark: Explaining one gradient is positive (rising) and the other is negative (falling). ✓ 1 mark: Clear mathematical conclusion.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 10 Mathematical Literacy: Finance, Tariffs & Measurement',
    description:
      'Grade 10 Maths Literacy revision focusing on household budgets, municipal water tariffs, VAT (15%), and perimeter/area calculations.',
    subject: SubjectCode.MATHEMATICAL_LITERACY,
    grade: 10,
    term: 2,
    year: 2026,
    durationMinutes: 40,
    questions: [
      {
        questionNumber: 1,
        topic: 'VAT & Consumer Finance',
        type: QuestionType.NUMERIC,
        prompt:
          'A school blazer costs R400 excluding VAT. Calculate the final selling price including 15% VAT (give the numeric value in Rands).',
        options: [],
        correctAnswer: '460',
        rubricKeywords: ['R460', '460', '60'],
        explanation:
          'Step 1: Calculate 15% VAT: 400 × 0.15 = R60. Step 2: Add VAT to the VAT-exclusive price: R400 + R60 = R460.',
        marks: 3,
      },
      {
        questionNumber: 2,
        topic: 'Scale & Maps',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'What does a number scale of 1 : 50 000 on a map mean?',
        options: [
          'A) 1 cm on the map represents 50 000 km in reality',
          'B) 1 unit on the map represents 50 000 of the same units in reality',
          'C) 50 000 cm on the map represents 1 cm in reality',
          'D) The map is 50 000 times larger than the real area',
        ],
        correctAnswer: 'B) 1 unit on the map represents 50 000 of the same units in reality',
        rubricKeywords: ['same units', '50 000'],
        explanation:
          'A ratio/number scale of 1 : 50 000 means 1 unit measured on the map (e.g., 1 cm) equals 50 000 of the exact same units (50 000 cm = 500 m) on the ground.',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Municipal Stepped Tariffs',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain why municipalities use a stepped (sliding-scale) tariff system for household water consumption where higher brackets cost more per kilolitre.',
        options: [],
        correctAnswer:
          'Municipalities use stepped tariffs to provide affordable basic water to low-usage households while charging higher rates to heavy users to discourage water wastage and promote conservation.',
        rubricKeywords: [
          'affordable',
          'basic water',
          'discourage wastage',
          'conservation',
          'high usage',
        ],
        explanation:
          'Marking Rubric (3 marks): ✓ 1 mark: Ensures basic/essential water remains affordable for low-income households. ✓ 1 mark: Penalizes excessive/high water usage. ✓ 1 mark: Encourages water conservation and prevents wastage.',
        marks: 3,
      },
    ],
  },
  {
    title: 'Grade 10 Physical Sciences: Waves, Matter & Atomic Structure',
    description:
      'Grade 10 Physics & Chemistry exam prep covering transverse/longitudinal waves, electromagnetic radiation, isotopes, and chemical bonding.',
    subject: SubjectCode.PHYSICAL_SCIENCES,
    grade: 10,
    term: 2,
    year: 2026,
    durationMinutes: 45,
    questions: [
      {
        questionNumber: 1,
        topic: 'Wave Speed Equation',
        type: QuestionType.NUMERIC,
        prompt:
          'A water wave has a frequency of 5 Hz and a wavelength of 2.4 m. Calculate the speed of the wave in m/s.',
        options: [],
        correctAnswer: '12',
        rubricKeywords: ['v = f * lambda', '5 * 2.4', '12 m/s'],
        explanation:
          'Formula: v = f × λ. Substitute f = 5 Hz and λ = 2.4 m: v = 5 × 2.4 = 12 m/s.',
        marks: 3,
      },
      {
        questionNumber: 2,
        topic: 'Atomic Structure & Isotopes',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: 'Isotopes of the same element always have:',
        options: [
          'A) The same mass number but different atomic numbers',
          'B) The same number of protons but different numbers of neutrons',
          'C) The same number of neutrons but different numbers of electrons',
          'D) Different chemical properties in reactions',
        ],
        correctAnswer: 'B) The same number of protons but different numbers of neutrons',
        rubricKeywords: ['same number of protons', 'different numbers of neutrons'],
        explanation:
          'Isotopes are atoms of the same element (same atomic number Z = same number of protons) that have different mass numbers (A) due to a different number of neutrons in the nucleus.',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Transverse vs Longitudinal Waves',
        type: QuestionType.EXPLAIN,
        prompt:
          'Distinguish between a transverse wave and a longitudinal wave in terms of the direction of particle vibration relative to the direction of wave propagation.',
        options: [],
        correctAnswer:
          'In a transverse wave, particles of the medium vibrate perpendicular (at 90 degrees / right angles) to the direction of wave propagation. In a longitudinal wave, particles vibrate parallel to the direction of wave propagation.',
        rubricKeywords: [
          'perpendicular',
          'parallel',
          'direction of propagation',
          'particles vibrate',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 2 marks: Transverse wave - particles vibrate perpendicular (90°) to direction of wave motion. ✓ 2 marks: Longitudinal wave - particles vibrate parallel to direction of wave motion.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 10 Life Sciences: Cell Biology, Mitosis & Plant Tissues',
    description:
      'Grade 10 Life Sciences exam prep covering organic compounds, cell organelles, mitosis phases, and transpiration in plants.',
    subject: SubjectCode.LIFE_SCIENCES,
    grade: 10,
    term: 2,
    year: 2026,
    durationMinutes: 45,
    questions: [
      {
        questionNumber: 1,
        topic: 'Cell Organelles',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'Which organelle is responsible for cellular respiration and ATP energy production in both plant and animal cells?',
        options: [
          'A) Chloroplast',
          'B) Ribosome',
          'C) Mitochondrion',
          'D) Golgi apparatus',
        ],
        correctAnswer: 'C) Mitochondrion',
        rubricKeywords: ['Mitochondrion', 'ATP', 'cellular respiration'],
        explanation:
          'The mitochondrion is the site of aerobic cellular respiration, converting glucose into usable ATP energy for the cell.',
        marks: 2,
      },
      {
        questionNumber: 2,
        topic: 'Plant Conducting Tissues',
        type: QuestionType.TRUE_FALSE,
        prompt:
          'Xylem vessels transport water and dissolved mineral salts upwards from the roots to the leaves and are strengthened with lignin.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'xylem', 'lignin'],
        explanation:
          'True! Xylem consists of dead, hollow cells reinforced with lignin walls that transport water and mineral salts unidirectionally from roots to stems and leaves.',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Biological Importance of Mitosis',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain the biological importance of mitosis in living organisms and describe what happens to the chromosomes during Metaphase.',
        options: [],
        correctAnswer:
          'Mitosis is essential for growth, repair and replacement of damaged or worn-out tissues, and asexual reproduction while producing genetically identical daughter cells. During Metaphase, chromosomes line up along the equator of the cell attached to spindle fibres.',
        rubricKeywords: [
          'growth',
          'repair',
          'genetically identical',
          'equator',
          'spindle fibres',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: Growth of organism. ✓ 1 mark: Repair/replacement of damaged cells. ✓ 1 mark: Produces genetically identical cells. ✓ 1 mark: In Metaphase, chromosomes align at the equator attached to spindle fibres.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 10 Geography: The Atmosphere, Plate Tectonics & Water Resources',
    description:
      'Grade 10 Geography exam prep covering atmospheric layers, the greenhouse effect, continental drift, rock types, and relief rainfall.',
    subject: SubjectCode.GEOGRAPHY,
    grade: 10,
    term: 2,
    year: 2026,
    durationMinutes: 45,
    questions: [
      {
        questionNumber: 1,
        topic: 'Structure of the Atmosphere',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'In which layer of the atmosphere do almost all weather phenomena occur and temperature decreases with altitude?',
        options: [
          'A) Stratosphere',
          'B) Troposphere',
          'C) Mesosphere',
          'D) Thermosphere',
        ],
        correctAnswer: 'B) Troposphere',
        rubricKeywords: ['Troposphere', 'weather'],
        explanation:
          'The troposphere is the lowest atmospheric layer containing most water vapour and dust particles, where all weather occurs and temperature drops at the environmental lapse rate (6.5°C per 1000 m).',
        marks: 2,
      },
      {
        questionNumber: 2,
        topic: 'Ozone Layer Location',
        type: QuestionType.TRUE_FALSE,
        prompt:
          'The ozone layer, which absorbs harmful ultraviolet (UV) solar radiation, is located in the Stratosphere.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'Stratosphere', 'UV'],
        explanation:
          'True! Ozone (O₃) is concentrated in the stratosphere (roughly 15–35 km altitude), where absorption of UV rays causes temperature to increase with height.',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Orographic (Relief) Rainfall',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain how relief (orographic) rainfall forms when warm, moist onshore winds blow from the ocean towards a coastal mountain range, and explain why a rain shadow forms on the leeward side.',
        options: [],
        correctAnswer:
          'Warm moist air is forced to rise up the windward slope of the mountain. As the air rises, it expands and cools adiabatically until it reaches dew point temperature, causing condensation and clouds that bring rain to the windward side. As the dry air descends the leeward slope, it warms and absorbs moisture, creating an arid rain shadow.',
        rubricKeywords: [
          'windward',
          'forced to rise',
          'cools',
          'condensation',
          'leeward',
          'descends',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: Moist air forced to rise up windward slope. ✓ 1 mark: Rising air cools to dew point and condenses to form clouds/rain. ✓ 1 mark: Air descends on the leeward side and warms adiabatically. ✓ 1 mark: Dry descending air causes low rainfall (rain shadow).',
        marks: 4,
      },
    ],
  },

  // ============================================================================
  // GRADE 11 PAPERS (5 SUBJECTS)
  // ============================================================================
  {
    title: 'Grade 11 Mathematics: Quadratic Equations, Surds, Trigonometry & Circle Geometry',
    description:
      'CAPS Grade 11 Mathematics exam prep covering completing the square, nature of roots, trigonometric identities, and Euclidean circle theorems.',
    subject: SubjectCode.MATHEMATICS,
    grade: 11,
    term: 2,
    year: 2026,
    durationMinutes: 50,
    questions: [
      {
        questionNumber: 1,
        topic: 'Nature of Roots (Discriminant)',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'If the discriminant Δ = b² - 4ac of a quadratic equation ax² + bx + c = 0 (with rational coefficients) is equal to 25, then the roots are:',
        options: [
          'A) Non-real (imaginary)',
          'B) Real, rational, and equal',
          'C) Real, rational, and unequal',
          'D) Real, irrational, and unequal',
        ],
        correctAnswer: 'C) Real, rational, and unequal',
        rubricKeywords: ['Real, rational, and unequal', 'perfect square'],
        explanation:
          'Since Δ = 25 > 0 and 25 is a perfect square (5²), √Δ = 5 is rational. Therefore the roots are real, rational, and unequal.',
        marks: 2,
      },
      {
        questionNumber: 2,
        topic: 'Euclidean Circle Geometry',
        type: QuestionType.NUMERIC,
        prompt:
          'O is the centre of a circle. Chord AB subtends an angle of 116° at the centre (∠AOB = 116°). Calculate the size (in degrees) of the angle ∠ACB subtended at the circumference in the same segment.',
        options: [],
        correctAnswer: '58',
        rubricKeywords: ['58', '58°', 'angle at centre is twice angle at circumference'],
        explanation:
          'Theorem: Angle at the centre is 2 × angle at the circumference (∠AOB = 2 × ∠ACB). Therefore ∠ACB = 116° ÷ 2 = 58°.',
        marks: 3,
      },
      {
        questionNumber: 3,
        topic: 'Trigonometric Identities & Reduction',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain step-by-step how to prove the fundamental trigonometric identity tan θ × cos θ = sin θ, and state the values of θ in [0°; 360°] for which the identity is undefined.',
        options: [],
        correctAnswer:
          'Replace tan θ with the quotient identity sin θ / cos θ on the left-hand side: (sin θ / cos θ) × cos θ. Cancel out cos θ in the numerator and denominator to get sin θ, which equals the right-hand side. The identity is undefined when cos θ = 0, at θ = 90° and θ = 270°.',
        rubricKeywords: [
          'sin',
          'cos',
          'cancel',
          '90',
          '270',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: Quotient identity tan θ = sin θ / cos θ. ✓ 1 mark: Simplifying (sin θ / cos θ) × cos θ = sin θ = RHS. ✓ 2 marks: Undefined where cos θ = 0, so θ = 90° and θ = 270°.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 11 Mathematical Literacy: Compound Interest, Inflation & Probability',
    description:
      'Grade 11 Maths Literacy exam prep covering compound interest, inflation rates, break-even analysis, and tree diagrams.',
    subject: SubjectCode.MATHEMATICAL_LITERACY,
    grade: 11,
    term: 2,
    year: 2026,
    durationMinutes: 45,
    questions: [
      {
        questionNumber: 1,
        topic: 'Break-Even Analysis',
        type: QuestionType.NUMERIC,
        prompt:
          'A learner sells homemade muffins for R20 each. Fixed costs are R300 and each muffin costs R8 to make. How many muffins must be sold to break even?',
        options: [],
        correctAnswer: '25',
        rubricKeywords: ['25', '20x = 300 + 8x', '12x = 300'],
        explanation:
          'Profit per muffin (contribution) = R20 - R8 = R12. Break-even quantity = Fixed Costs ÷ Profit per unit = R300 ÷ R12 = 25 muffins.',
        marks: 3,
      },
      {
        questionNumber: 2,
        topic: 'Inflation & Purchasing Power',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'If the annual inflation rate drops from 6.5% in 2025 to 5.0% in 2026, what happens to the general prices of goods in 2026?',
        options: [
          'A) Prices decrease by 1.5%',
          'B) Prices remain completely unchanged',
          'C) Prices still increase, but at a slower rate of 5.0%',
          'D) Goods become cheaper than they were in 2024',
        ],
        correctAnswer: 'C) Prices still increase, but at a slower rate of 5.0%',
        rubricKeywords: ['still increase', 'slower rate'],
        explanation:
          'A positive inflation rate (5.0%) means prices are still rising year-on-year, just at a slower pace than when inflation was 6.5%. Prices only fall when inflation is negative (deflation).',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Simple vs Compound Interest',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain the difference between Simple Interest and Compound Interest when investing money over multiple years, and state which option yields higher returns for an investor.',
        options: [],
        correctAnswer:
          'Simple interest is calculated only on the original principal amount each year, whereas compound interest is calculated on the original principal plus all accumulated interest from previous periods (interest on interest). Compound interest yields higher returns for an investor.',
        rubricKeywords: [
          'original principal',
          'accumulated interest',
          'interest on interest',
          'compound interest',
          'higher',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: Simple interest calculated on initial principal only. ✓ 2 marks: Compound interest calculated on principal + accumulated interest ("interest on interest"). ✓ 1 mark: Compound interest gives higher investment growth.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 11 Physical Sciences: Newtons Laws, Electrostatics & Intermolecular Forces',
    description:
      'Grade 11 Physics & Chemistry exam prep covering Newtons Second Law, Coulombs Law, ideal gases, and hydrogen bonding.',
    subject: SubjectCode.PHYSICAL_SCIENCES,
    grade: 11,
    term: 2,
    year: 2026,
    durationMinutes: 50,
    questions: [
      {
        questionNumber: 1,
        topic: "Newton's Second Law of Motion",
        type: QuestionType.NUMERIC,
        prompt:
          'A horizontal applied force of 50 N pulls a 10 kg crate across a rough floor. If the kinetic frictional force is 14 N, calculate the acceleration of the crate in m/s².',
        options: [],
        correctAnswer: '3.6',
        rubricKeywords: ['3.6', 'Fnet = ma', '50 - 14 = 36', '36 / 10'],
        explanation:
          'Step 1: Calculate net horizontal force: F_net = F_applied - f_k = 50 N - 14 N = 36 N. Step 2: Apply Newton’s Second Law (F_net = m × a): 36 = 10 × a → a = 3.6 m/s².',
        marks: 3,
      },
      {
        questionNumber: 2,
        topic: "Coulomb's Law of Electrostatics",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'Two point charges exert an electrostatic force F on each other when separated by distance r. If the distance between them is doubled (2r), the new electrostatic force becomes:',
        options: ['A) 2F', 'B) 4F', 'C) F/2', 'D) F/4'],
        correctAnswer: 'D) F/4',
        rubricKeywords: ['F/4', 'inverse square'],
        explanation:
          'By Coulomb’s Law, F ∝ 1/r². Doubling the distance r to 2r changes the force by 1/(2)² = 1/4, so the new force is F/4.',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Intermolecular Forces & Boiling Points',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain why water (H₂O) has a much higher boiling point (100°C) than hydrogen sulphide (H₂S, -60°C), even though both molecules have a similar bent geometry.',
        options: [],
        correctAnswer:
          'Water (H₂O) has strong hydrogen bonds between its molecules due to the high electronegativity of oxygen bonded to hydrogen, whereas H₂S only has weaker dipole-dipole forces. More energy is required to overcome the stronger intermolecular hydrogen bonds in H₂O, resulting in a higher boiling point.',
        rubricKeywords: [
          'hydrogen bonds',
          'dipole-dipole',
          'stronger intermolecular forces',
          'more energy',
          'overcome',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: Identify hydrogen bonding in H₂O. ✓ 1 mark: Identify weaker dipole-dipole forces in H₂S. ✓ 1 mark: State hydrogen bonds are stronger than dipole-dipole forces. ✓ 1 mark: Conclude more thermal energy is needed to overcome intermolecular forces in H₂O.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 11 Life Sciences: Photosynthesis, Cellular Respiration & Gas Exchange',
    description:
      'Grade 11 Life Sciences exam prep covering light/dark phases of photosynthesis, human breathing mechanism, and nephron osmoregulation.',
    subject: SubjectCode.LIFE_SCIENCES,
    grade: 11,
    term: 2,
    year: 2026,
    durationMinutes: 45,
    questions: [
      {
        questionNumber: 1,
        topic: 'Photosynthesis Phases',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'Where in the chloroplast does the light-independent phase (Calvin cycle) of photosynthesis take place?',
        options: [
          'A) Grana / Thylakoid membranes',
          'B) Stroma',
          'C) Cristae',
          'D) Cytoplasm',
        ],
        correctAnswer: 'B) Stroma',
        rubricKeywords: ['Stroma', 'Calvin cycle'],
        explanation:
          'The light-dependent phase occurs in the grana (thylakoids), whereas the light-independent phase (Calvin cycle) occurs in the fluid-filled stroma of the chloroplast.',
        marks: 2,
      },
      {
        questionNumber: 2,
        topic: 'Human Gas Exchange',
        type: QuestionType.TRUE_FALSE,
        prompt:
          'During inhalation (inspiration), the diaphragm contracts and flattens while thoracic volume increases and pressure inside the lungs decreases.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'diaphragm contracts', 'thoracic volume increases'],
        explanation:
          'True! Contracting the diaphragm (moving downwards) and external intercostal muscles increases thoracic cavity volume, lowering intrapulmonary pressure below atmospheric pressure so air rushes into the lungs.',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Structural Adaptations of Alveoli',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain FOUR structural adaptations of the human alveoli that make them efficient surfaces for gaseous exchange.',
        options: [],
        correctAnswer:
          'Alveoli are numerous and lobed to provide a large surface area; their walls consist of a single layer of squamous epithelium (one cell thick) for rapid diffusion; they are lined with a thin film of moisture so gases can dissolve; and they are richly supplied with a dense network of blood capillaries to maintain a steep diffusion gradient.',
        rubricKeywords: [
          'large surface area',
          'single layer',
          'moisture',
          'capillaries',
          'diffusion gradient',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: Large surface area (millions of alveoli). ✓ 1 mark: Thin walls (single layer of squamous epithelium) for short diffusion distance. ✓ 1 mark: Moist inner surface to dissolve O₂ and CO₂. ✓ 1 mark: Rich blood capillary network to transport gases and maintain steep concentration gradient.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 11 Geography: Global Air Circulation, Monsoons, El Niño & Geomorphology',
    description:
      'Grade 11 Geography exam prep covering Tri-cellular circulation (Hadley, Ferrel, Polar cells), Coriolis force, El Niño/La Niña, and slope elements.',
    subject: SubjectCode.GEOGRAPHY,
    grade: 11,
    term: 2,
    year: 2026,
    durationMinutes: 45,
    questions: [
      {
        questionNumber: 1,
        topic: 'Coriolis Force & Wind Deflection',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'Due to the Coriolis force caused by Earth’s rotation, winds in the Southern Hemisphere are deflected to the:',
        options: [
          'A) Right of their intended path',
          'B) Left of their intended path',
          'C) Directly along the isobars without deflection',
          'D) Towards the Equator only',
        ],
        correctAnswer: 'B) Left of their intended path',
        rubricKeywords: ['Left', 'Southern Hemisphere'],
        explanation:
          'Ferrel’s Law states that the Coriolis force deflects moving air to the LEFT in the Southern Hemisphere and to the RIGHT in the Northern Hemisphere.',
        marks: 2,
      },
      {
        questionNumber: 2,
        topic: 'Slope Elements (Geomorphology)',
        type: QuestionType.TRUE_FALSE,
        prompt:
          'The talus (scree) slope element is located directly below the free-face (cliff) and maintains a constant angle as rock debris accumulates.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'talus', 'scree'],
        explanation:
          'True! Weathering on the cliff (free-face) drops rock fragments that collect on the talus (scree) slope below, maintaining a uniform slope angle of roughly 30°–35°.',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'El Niño Impact on Southern Africa',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain how an El Niño event alters ocean temperatures and atmospheric pressure over the Pacific and Indian Oceans, and describe its impact on rainfall and agriculture in Southern Africa.',
        options: [],
        correctAnswer:
          'During El Niño, trade winds weaken and warm water shifts eastward across the Pacific, causing high atmospheric pressure and subsiding dry air over Southern Africa. This leads to below-normal rainfall, drought conditions, water shortages, and reduced crop yields in Southern Africa.',
        rubricKeywords: [
          'trade winds weaken',
          'high pressure',
          'subsiding air',
          'drought',
          'crop yields',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: Weakening of trade winds / shift of warm water. ✓ 1 mark: High pressure / subsiding air over Southern Africa prevents cloud formation. ✓ 1 mark: Below-average rainfall / drought conditions. ✓ 1 mark: Negative impact on crop yields, livestock, and food security.',
        marks: 4,
      },
    ],
  },

  // ============================================================================
  // GRADE 12 PAPERS (5 SUBJECTS - MATRIC EXAM PREP)
  // ============================================================================
  {
    title: 'Grade 12 Mathematics (Matric): Differential Calculus, Sequences & Financial Maths',
    description:
      'NSC Grade 12 Matric Mathematics Paper 1 revision covering arithmetic/geometric series, first principles derivatives, cubic graphs, and annuities.',
    subject: SubjectCode.MATHEMATICS,
    grade: 12,
    term: 3,
    year: 2026,
    durationMinutes: 60,
    questions: [
      {
        questionNumber: 1,
        topic: 'Differential Calculus - Turning Points',
        type: QuestionType.NUMERIC,
        prompt:
          'Given the cubic function f(x) = x³ - 6x² + 9x + 2, calculate the smaller x-coordinate of the stationary (turning) points where f\'(x) = 0.',
        options: [],
        correctAnswer: '1',
        rubricKeywords: ['1', '3x^2 - 12x + 9 = 0', '(x - 1)(x - 3) = 0'],
        explanation:
          'Step 1: Find the derivative: f\'(x) = 3x² - 12x + 9. Step 2: Set f\'(x) = 0 for stationary points: 3(x² - 4x + 3) = 0 → 3(x - 1)(x - 3) = 0. Step 3: Stationary points are at x = 1 and x = 3. The smaller x-coordinate is 1.',
        marks: 4,
      },
      {
        questionNumber: 2,
        topic: 'Convergent Geometric Series',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'For which values of x does the infinite geometric series 2 + 2(x - 1) + 2(x - 1)² + ... converge?',
        options: [
          'A) -1 < x < 1',
          'B) 0 < x < 2',
          'C) x > 2 or x < 0',
          'D) -2 < x < 2',
        ],
        correctAnswer: 'B) 0 < x < 2',
        rubricKeywords: ['0 < x < 2', '-1 < r < 1'],
        explanation:
          'An infinite geometric series converges when -1 < r < 1. Here the common ratio is r = x - 1. So -1 < x - 1 < 1. Adding 1 to all parts gives 0 < x < 2.',
        marks: 3,
      },
      {
        questionNumber: 3,
        topic: 'Concavity & Point of Inflection',
        type: QuestionType.TRUE_FALSE,
        prompt:
          'At the point of inflection of a cubic function f(x), the second derivative f\'\'(x) is equal to zero and concavity changes.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'second derivative', 'concavity'],
        explanation:
          'True! A cubic graph changes from concave up (f\'\'(x) > 0) to concave down (f\'\'(x) < 0) or vice versa at its unique point of inflection where f\'\'(x) = 0.',
        marks: 2,
      },
      {
        questionNumber: 4,
        topic: 'Calculus Optimization & Tangent Reasoning',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain why we set the first derivative f\'(x) = 0 when finding the maximum volume of a 3D container in a Matric Calculus optimization problem, and how the second derivative test confirms it is a maximum.',
        options: [],
        correctAnswer:
          'The first derivative f\'(x) represents the gradient of the tangent (rate of change). At a local maximum turning point, the tangent line is horizontal so its gradient f\'(x) = 0. Using the second derivative test, if f\'\'(x) < 0 (negative), the graph is concave down, confirming the stationary point is a maximum.',
        rubricKeywords: [
          'gradient of tangent',
          'horizontal',
          'rate of change',
          'f\'\'(x) < 0',
          'concave down',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: f\'(x) is the rate of change / gradient of tangent. ✓ 1 mark: At a maximum turning point, the tangent is horizontal (f\'(x) = 0). ✓ 1 mark: Second derivative test checks f\'\'(x) < 0. ✓ 1 mark: f\'\'(x) < 0 means concave down, confirming a local maximum.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 12 Mathematical Literacy (Matric): SARS Income Tax, Loans & Data Handling',
    description:
      'NSC Grade 12 Matric Maths Literacy revision covering personal income tax tables, tax rebates, medical tax credits, and box-and-whisker quartiles.',
    subject: SubjectCode.MATHEMATICAL_LITERACY,
    grade: 12,
    term: 3,
    year: 2026,
    durationMinutes: 50,
    questions: [
      {
        questionNumber: 1,
        topic: 'Data Handling - Interquartile Range (IQR)',
        type: QuestionType.NUMERIC,
        prompt:
          'In a Grade 12 dataset of test scores, the lower quartile (Q₁) is 48 and the upper quartile (Q₃) is 79. Calculate the Interquartile Range (IQR).',
        options: [],
        correctAnswer: '31',
        rubricKeywords: ['31', '79 - 48', 'Q3 - Q1'],
        explanation:
          'Formula: IQR = Q₃ - Q₁ = 79 - 48 = 31. The middle 50% of learners scored within a range of 31 marks.',
        marks: 2,
      },
      {
        questionNumber: 2,
        topic: 'Percentile Interpretation',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'If a Matric learner’s score lies at the 85th percentile of the national cohort, this means:',
        options: [
          'A) The learner achieved 85% on the examination paper',
          'B) 85% of the learners in the cohort scored equal to or lower than this learner',
          'C) 85% of the learners scored higher than this learner',
          'D) The learner answered 85 questions correctly',
        ],
        correctAnswer:
          'B) 85% of the learners in the cohort scored equal to or lower than this learner',
        rubricKeywords: ['85% of the learners', 'lower', '15%'],
        explanation:
          'The 85th percentile means the learner performed better than or equal to 85% of all candidates (and only 15% of candidates scored higher).',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'SARS Personal Income Tax & Rebates',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain the difference between a tax deduction (such as pension fund contributions) and a tax rebate (such as the primary rebate) when calculating a taxpayer’s annual SARS income tax.',
        options: [],
        correctAnswer:
          'A tax deduction (like pension contributions) is subtracted from gross income before looking up the tax bracket to reduce taxable income. A tax rebate is a fixed Rand amount subtracted directly from the calculated tax payable after using the tax bracket formula.',
        rubricKeywords: [
          'taxable income',
          'subtracted from gross income',
          'before tax bracket',
          'tax rebate',
          'subtracted from tax payable',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 2 marks: Tax deduction reduces gross income to determine taxable income BEFORE applying the tax table. ✓ 2 marks: Tax rebate is subtracted directly from the calculated tax amount AFTER applying the tax bracket.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 12 Physical Sciences (Matric): Momentum, Work-Energy, Doppler & Electrochemistry',
    description:
      'NSC Grade 12 Matric Physical Sciences revision covering conservation of linear momentum, Work-Energy Theorem, Doppler Effect, and galvanic/electrolytic cells.',
    subject: SubjectCode.PHYSICAL_SCIENCES,
    grade: 12,
    term: 3,
    year: 2026,
    durationMinutes: 60,
    questions: [
      {
        questionNumber: 1,
        topic: 'Impulse & Change in Momentum',
        type: QuestionType.NUMERIC,
        prompt:
          'A 0.5 kg soccer ball moving east at 10 m/s is kicked so that it moves west at 14 m/s. Calculate the magnitude of the impulse (in N·s) exerted on the ball.',
        options: [],
        correctAnswer: '12',
        rubricKeywords: ['12', '0.5(-14 - 10)', 'm(vf - vi)'],
        explanation:
          'Take East as positive (+10 m/s) and West as negative (-14 m/s). Impulse = Δp = m(v_f - v_i) = 0.5 × (-14 - 10) = 0.5 × (-24) = -12 N·s. The magnitude of the impulse is 12 N·s.',
        marks: 4,
      },
      {
        questionNumber: 2,
        topic: 'Doppler Effect & Red Shift',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'When an ambulance with a blaring siren moves rapidly AWAY from a stationary listener, how do the observed frequency and wavelength compare to the emitted sound?',
        options: [
          'A) Observed frequency is higher and wavelength is shorter',
          'B) Observed frequency is lower and wavelength is longer',
          'C) Observed frequency is lower and wavelength is shorter',
          'D) Both frequency and wavelength remain unchanged',
        ],
        correctAnswer: 'B) Observed frequency is lower and wavelength is longer',
        rubricKeywords: ['frequency is lower', 'wavelength is longer'],
        explanation:
          'As the sound source recedes from the observer, wave fronts are stretched apart (longer wavelength λ), resulting in fewer wave crests reaching the ear per second (lower observed frequency f_L < f_S).',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Chemical Equilibrium & Le Chatelier’s Principle',
        type: QuestionType.EXPLAIN,
        prompt:
          'In the exothermic Haber process N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH < 0), explain using Le Chatelier’s Principle how increasing the pressure (by decreasing volume) affects the equilibrium yield of ammonia (NH₃).',
        options: [],
        correctAnswer:
          'By Le Chatelier’s Principle, increasing the pressure disturbs the equilibrium, so the system shifts to decrease the pressure by favouring the side with fewer moles of gas. There are 4 moles of gas on the left (1 N₂ + 3 H₂) and 2 moles of gas on the right (2 NH₃). Therefore the forward reaction is favoured and the yield of ammonia increases.',
        rubricKeywords: [
          'Le Chatelier',
          'fewer moles of gas',
          '4 moles',
          '2 moles',
          'forward reaction favoured',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: System opposes the increase in pressure by favouring the side with fewer gas moles. ✓ 1 mark: Compare 4 moles of reactant gas vs 2 moles of product gas. ✓ 1 mark: Forward reaction is favoured. ✓ 1 mark: Equilibrium yield of NH₃ increases.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 12 Life Sciences (Matric): DNA, Protein Synthesis, Meiosis, Genetics & Evolution',
    description:
      'NSC Grade 12 Matric Life Sciences revision covering DNA replication, transcription/translation, crossing over in meiosis, genetics crosses, and natural selection.',
    subject: SubjectCode.LIFE_SCIENCES,
    grade: 12,
    term: 3,
    year: 2026,
    durationMinutes: 55,
    questions: [
      {
        questionNumber: 1,
        topic: 'DNA Base Pairing & Coding',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'If a DNA template strand has the nitrogenous base triplet TAC, what is the corresponding mRNA codon formed during transcription?',
        options: ['A) ATG', 'B) AUG', 'C) UAC', 'D) GUA'],
        correctAnswer: 'B) AUG',
        rubricKeywords: ['AUG', 'Uracil'],
        explanation:
          'In RNA, Adenine (A) pairs with Uracil (U) instead of Thymine (T), and Cytosine (C) pairs with Guanine (G). Thus DNA triplet T-A-C transcribes into mRNA codon A-U-G.',
        marks: 2,
      },
      {
        questionNumber: 2,
        topic: 'Meiosis & Chromosome Number',
        type: QuestionType.NUMERIC,
        prompt:
          'A human somatic (body) cell contains 46 chromosomes. How many chromosomes will be present in a normal human gamete (sperm or ovum) produced at the end of Meiosis II?',
        options: [],
        correctAnswer: '23',
        rubricKeywords: ['23', 'haploid'],
        explanation:
          'Meiosis is a reduction division that halves the diploid chromosome number (2n = 46) to produce haploid gametes (n = 23).',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Protein Synthesis - Transcription vs Translation',
        type: QuestionType.EXPLAIN,
        prompt:
          'Describe the role of mRNA and tRNA during the translation stage of protein synthesis at the ribosome.',
        options: [],
        correctAnswer:
          'mRNA attaches to the ribosome and provides the sequence of codons that specifies the order of amino acids. tRNA molecules carry specific amino acids from the cytoplasm to the ribosome; each tRNA has a complementary anticodon that pairs with the matching mRNA codon so amino acids join by peptide bonds to form a polypeptide protein.',
        rubricKeywords: [
          'ribosome',
          'codons',
          'anticodon',
          'amino acids',
          'peptide bonds',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: mRNA carries codons and binds to the ribosome. ✓ 1 mark: tRNA brings specific amino acids to the ribosome. ✓ 1 mark: tRNA anticodon complementary base-pairs with mRNA codon. ✓ 1 mark: Amino acids link via peptide bonds to form a protein.',
        marks: 4,
      },
    ],
  },
  {
    title: 'Grade 12 Geography (Matric): Mid-Latitude Cyclones, Fluvial Geomorphology & Urban Settlement',
    description:
      'NSC Grade 12 Matric Geography revision covering cold fronts, tropical cyclones, river capture (stream piracy), drainage density, and urban land-use zones.',
    subject: SubjectCode.GEOGRAPHY,
    grade: 12,
    term: 3,
    year: 2026,
    durationMinutes: 55,
    questions: [
      {
        questionNumber: 1,
        topic: 'Mid-Latitude Cyclones & Cold Fronts',
        type: QuestionType.MULTIPLE_CHOICE,
        prompt:
          'Which cloud type and weather change are typically experienced in Cape Town as the cold front of a mid-latitude cyclone passes over?',
        options: [
          'A) Cirrus clouds, rising temperatures, and calm winds',
          'B) Cumulonimbus clouds, sudden drop in temperature, heavy rain, and wind backing',
          'C) Stratus clouds, tropical heatwave, and zero humidity',
          'D) Clear skies due to strong subsidence from the Kalahari High',
        ],
        correctAnswer:
          'B) Cumulonimbus clouds, sudden drop in temperature, heavy rain, and wind backing',
        rubricKeywords: ['Cumulonimbus', 'drop in temperature', 'backing'],
        explanation:
          'Dense cold air undercuts warm air sharply along the steep cold front, causing rapid uplift, cumulonimbus clouds, heavy showers, a sudden drop in temperature, rising pressure, and wind backing from NW to SW.',
        marks: 2,
      },
      {
        questionNumber: 2,
        topic: 'Tropical Cyclone Naming & Eye',
        type: QuestionType.TRUE_FALSE,
        prompt:
          'At the centre (eye) of a mature tropical cyclone, weather conditions are calm, cloudless, and warm due to descending air.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        rubricKeywords: ['True', 'eye', 'descending air'],
        explanation:
          'True! While the eyewall has violent winds and torrential rain, the eye itself has subsiding (sinking) air which warms adiabatically, producing calm, clear conditions.',
        marks: 2,
      },
      {
        questionNumber: 3,
        topic: 'Fluvial Geomorphology - River Capture (Stream Piracy)',
        type: QuestionType.EXPLAIN,
        prompt:
          'Explain how headward erosion leads to river capture (stream piracy), and name the resulting features formed at the point of capture and in the deprived stream.',
        options: [],
        correctAnswer:
          'An energetic captor stream flowing at a lower altitude or over softer rock erodes backwards (headward erosion) through the watershed until it intercepts and diverts the headwaters of a less energetic river. This forms an elbow of capture at the point of diversion, a dry wind gap below the elbow, and leaves the lower course as a misfit (underfit) stream.',
        rubricKeywords: [
          'headward erosion',
          'watershed',
          'elbow of capture',
          'wind gap',
          'misfit stream',
        ],
        explanation:
          'Marking Rubric (4 marks): ✓ 1 mark: Energetic captor stream erodes backwards through watershed via headward erosion. ✓ 1 mark: Diverts water from the captured river. ✓ 1 mark: Identifies elbow of capture and wind gap. ✓ 1 mark: Identifies misfit (underfit) stream.',
        marks: 4,
      },
    ],
  },
];

async function main() {
  console.log('Seeding Academic Exam Prep Database (Grades 10, 11, 12)...');

  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const userPasswordHash = await bcrypt.hash('User123!', 10);

  // 1. Create Admin & Learner Accounts across Grades 10, 11, 12
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

  // 2. Seed Exam Papers if not already present
  const existingPapersCount = await prisma.examPaper.count();
  if (existingPapersCount === 0) {
    for (const paperData of EXAM_PAPERS_SEED) {
      const totalMarks = paperData.questions.reduce((s, q) => s + q.marks, 0);
      await prisma.examPaper.create({
        data: {
          title: paperData.title,
          description: paperData.description,
          subject: paperData.subject,
          grade: paperData.grade,
          term: paperData.term,
          year: paperData.year,
          durationMinutes: paperData.durationMinutes,
          totalMarks,
          isPublished: true,
          createdById: admin.id,
          questions: {
            create: paperData.questions,
          },
        },
      });
    }
    console.log(`Seeded ${EXAM_PAPERS_SEED.length} Exam Prep Papers across Grades 10, 11, and 12!`);
  }

  // 3. Seed Realistic Exam Attempts for Learners so Admin Dashboard has rich progress telemetry
  const existingAttemptsCount = await prisma.examAttempt.count();
  if (existingAttemptsCount === 0) {
    const allPapers = await prisma.examPaper.findMany({
      include: { questions: true },
    });

    async function createSampleAttempt(
      learnerId: string,
      paper: (typeof allPapers)[0],
      timeSpentSeconds: number,
      teacherFeedback?: string
    ) {
      let scoreEarned = 0;
      let totalMarks = 0;

      const answersPayload = paper.questions.map((q, idx) => {
        // Simulate high-quality answers on most questions and partial on the last one
        const answerText =
          idx === paper.questions.length - 1 && q.type === QuestionType.EXPLAIN
            ? q.rubricKeywords.slice(0, Math.ceil(q.rubricKeywords.length * 0.75)).join(', ') +
              ' as explained in the topic.'
            : q.correctAnswer;

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
          mode: 'REVISION',
          scoreEarned,
          totalMarks,
          percentage,
          gradeSymbol: calculateAchievementLevel(percentage),
          timeSpentSeconds,
          teacherFeedback: teacherFeedback || null,
          answers: {
            create: answersPayload,
          },
        },
      });
    }

    const g10Math = allPapers.find(
      (p) => p.grade === 10 && p.subject === SubjectCode.MATHEMATICS
    );
    const g10Phys = allPapers.find(
      (p) => p.grade === 10 && p.subject === SubjectCode.PHYSICAL_SCIENCES
    );
    const g11Math = allPapers.find(
      (p) => p.grade === 11 && p.subject === SubjectCode.MATHEMATICS
    );
    const g11Life = allPapers.find(
      (p) => p.grade === 11 && p.subject === SubjectCode.LIFE_SCIENCES
    );
    const g12Math = allPapers.find(
      (p) => p.grade === 12 && p.subject === SubjectCode.MATHEMATICS
    );
    const g12Geog = allPapers.find(
      (p) => p.grade === 12 && p.subject === SubjectCode.GEOGRAPHY
    );

    if (g10Math) {
      await createSampleAttempt(
        grade10Learner.id,
        g10Math,
        940,
        'Great factorisation and exponent work! Review the perpendicular gradient proof for full marks.'
      );
    }
    if (g10Phys) {
      await createSampleAttempt(grade10Learner.id, g10Phys, 820);
    }
    if (g11Math) {
      await createSampleAttempt(
        grade11Learner.id,
        g11Math,
        1120,
        'Strong Euclidean geometry and discriminant reasoning.'
      );
    }
    if (g11Life) {
      await createSampleAttempt(grade11Learner.id, g11Life, 780);
    }
    if (g12Math) {
      await createSampleAttempt(
        grade12Learner.id,
        g12Math,
        1450,
        'Excellent Matric Calculus readiness! Keep practicing optimization proofs.'
      );
    }
    if (g12Geog) {
      await createSampleAttempt(grade12Learner.id, g12Geog, 1050);
    }
  }

  console.log('Academic seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
