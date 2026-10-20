import { QuestionType } from '@prisma/client';

export interface GradeQuestionInput {
  type: QuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  rubricKeywords: string[];
  explanation: string;
  marks: number;
}

export interface GradeQuestionResult {
  marksEarned: number;
  maxMarks: number;
  isCorrect: boolean;
  isPartial: boolean;
  matchedKeywords: string[];
  missedKeywords: string[];
  gradingFeedback: string;
}

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeNumeric(str: string): string {
  return str
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/^[a-z]\s*=\s*/i, '')
    .replace(/\s+/g, '')
    .trim();
}

export function gradeStudentAnswer(
  question: GradeQuestionInput,
  rawStudentAnswer: string
): GradeQuestionResult {
  const maxMarks = question.marks || 1;
  const studentTrimmed = (rawStudentAnswer || '').trim();

  if (!studentTrimmed) {
    return {
      marksEarned: 0,
      maxMarks,
      isCorrect: false,
      isPartial: false,
      matchedKeywords: [],
      missedKeywords: question.rubricKeywords || [],
      gradingFeedback: 'No answer provided (0 marks). Review the worked explanation below.',
    };
  }

  // 1. MULTIPLE CHOICE
  if (question.type === QuestionType.MULTIPLE_CHOICE) {
    const normStudent = normalizeText(studentTrimmed);
    const normCorrect = normalizeText(question.correctAnswer);

    // Extract option letter (A, B, C, D) if present
    const studentLetterMatch = studentTrimmed.match(/^([A-Da-d])(?:\)|\.|\s|$)/);
    const correctLetterMatch = question.correctAnswer.match(/^([A-Da-d])(?:\)|\.|\s|$)/);

    const isExactMatch = normStudent === normCorrect;
    const isLetterMatch =
      studentLetterMatch &&
      correctLetterMatch &&
      studentLetterMatch[1].toUpperCase() === correctLetterMatch[1].toUpperCase();

    const isCorrect = Boolean(isExactMatch || isLetterMatch);

    return {
      marksEarned: isCorrect ? maxMarks : 0,
      maxMarks,
      isCorrect,
      isPartial: false,
      matchedKeywords: isCorrect ? [question.correctAnswer] : [],
      missedKeywords: isCorrect ? [] : [question.correctAnswer],
      gradingFeedback: isCorrect
        ? `Correct! Full marks awarded (${maxMarks}/${maxMarks}).`
        : `Incorrect. You selected "${studentTrimmed}", but the correct option is "${question.correctAnswer}".`,
    };
  }

  // 2. TRUE / FALSE
  if (question.type === QuestionType.TRUE_FALSE) {
    const normStudent = normalizeText(studentTrimmed);
    const normCorrect = normalizeText(question.correctAnswer);
    const isCorrect =
      normStudent === normCorrect ||
      (normCorrect.startsWith('true') && normStudent.startsWith('true')) ||
      (normCorrect.startsWith('false') && normStudent.startsWith('false'));

    return {
      marksEarned: isCorrect ? maxMarks : 0,
      maxMarks,
      isCorrect,
      isPartial: false,
      matchedKeywords: isCorrect ? [question.correctAnswer] : [],
      missedKeywords: isCorrect ? [] : [question.correctAnswer],
      gradingFeedback: isCorrect
        ? `Correct! (${maxMarks}/${maxMarks} marks).`
        : `Incorrect. The correct statement value is ${question.correctAnswer}.`,
    };
  }

  // 3. NUMERIC / SHORT CALCULATION
  if (question.type === QuestionType.NUMERIC) {
    const normStudent = normalizeNumeric(studentTrimmed);
    const normCorrect = normalizeNumeric(question.correctAnswer);

    const acceptedForms = [
      normCorrect,
      ...(question.rubricKeywords || []).map((k) => normalizeNumeric(k)),
    ];

    const isExactNumeric = acceptedForms.some(
      (acc) => acc && (normStudent === acc || normStudent.includes(acc))
    );

    if (isExactNumeric) {
      return {
        marksEarned: maxMarks,
        maxMarks,
        isCorrect: true,
        isPartial: false,
        matchedKeywords: [question.correctAnswer],
        missedKeywords: [],
        gradingFeedback: `Correct calculation & final value! Awarded ${maxMarks}/${maxMarks} marks.`,
      };
    }

    // Check if student showed partial working steps matching rubricKeywords
    const matchedWorking: string[] = [];
    const missedWorking: string[] = [];
    for (const kw of question.rubricKeywords || []) {
      if (normalizeText(studentTrimmed).includes(normalizeText(kw))) {
        matchedWorking.push(kw);
      } else {
        missedWorking.push(kw);
      }
    }

    if (matchedWorking.length > 0 && maxMarks > 1) {
      const partialMarks = Math.min(
        maxMarks - 1,
        Math.max(1, Math.round((matchedWorking.length / (question.rubricKeywords.length || 1)) * maxMarks))
      );
      return {
        marksEarned: partialMarks,
        maxMarks,
        isCorrect: false,
        isPartial: true,
        matchedKeywords: matchedWorking,
        missedKeywords: [question.correctAnswer, ...missedWorking],
        gradingFeedback: `Method marks awarded (${partialMarks}/${maxMarks}): Your working included [${matchedWorking.join(
          ', '
        )}], but the final value should be "${question.correctAnswer}".`,
      };
    }

    return {
      marksEarned: 0,
      maxMarks,
      isCorrect: false,
      isPartial: false,
      matchedKeywords: [],
      missedKeywords: [question.correctAnswer],
      gradingFeedback: `Incorrect value. Expected "${question.correctAnswer}". Check the step-by-step calculation below.`,
    };
  }

  // 4. EXPLAIN / STRUCTURED LONG-ANSWER QUESTION (Rubric-based concept grading)
  const normStudent = normalizeText(studentTrimmed);
  const rubricList =
    question.rubricKeywords && question.rubricKeywords.length > 0
      ? question.rubricKeywords
      : question.correctAnswer
          .split(/[,;.]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 3);

  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];

  for (const criterion of rubricList) {
    const normCriterion = normalizeText(criterion);
    // Check direct phrase inclusion OR whether all significant words (>3 chars) of the criterion appear in the learner's explanation
    const significantWords = normCriterion
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['with', 'from', 'that', 'this', 'into', 'when', 'than'].includes(w));

    const directHit = normStudent.includes(normCriterion);
    const wordHit =
      significantWords.length > 0 &&
      significantWords.filter((w) => normStudent.includes(w)).length >=
        Math.ceil(significantWords.length * 0.7);

    if (directHit || wordHit) {
      matchedKeywords.push(criterion);
    } else {
      missedKeywords.push(criterion);
    }
  }

  const ratio = rubricList.length > 0 ? matchedKeywords.length / rubricList.length : 0;
  // Round to nearest 0.5 mark
  let marksEarned = Math.round(ratio * maxMarks * 2) / 2;

  // Ensure minimum length for full marks on explain questions
  if (marksEarned === maxMarks && studentTrimmed.split(/\s+/).length < 4 && maxMarks >= 2) {
    marksEarned = Math.max(1, maxMarks - 1);
  }

  const isCorrect = marksEarned >= maxMarks;
  const isPartial = marksEarned > 0 && marksEarned < maxMarks;

  let gradingFeedback = '';
  if (isCorrect) {
    gradingFeedback = `Excellent explanation! Full marks (${marksEarned}/${maxMarks}). You covered all key marking rubric points: ${matchedKeywords
      .map((k) => `"${k}"`)
      .join(', ')}.`;
  } else if (isPartial) {
    gradingFeedback = `Partial marks awarded (${marksEarned}/${maxMarks}). ✓ Rubric concepts hit: [${matchedKeywords.join(
      ', '
    )}]. ✗ To earn full marks, also include: [${missedKeywords.join(', ')}].`;
  } else {
    gradingFeedback = `0/${maxMarks} marks. Your explanation missed the key marking rubric concepts: [${missedKeywords.join(
      ', '
    )}]. Study the model memorandum below.`;
  }

  return {
    marksEarned,
    maxMarks,
    isCorrect,
    isPartial,
    matchedKeywords,
    missedKeywords,
    gradingFeedback,
  };
}

export function calculateAchievementLevel(percentage: number): string {
  if (percentage >= 80) return 'Level 7 - Outstanding Distinction (80–100%)';
  if (percentage >= 70) return 'Level 6 - Meritorious Achievement (70–79%)';
  if (percentage >= 60) return 'Level 5 - Substantial Achievement (60–69%)';
  if (percentage >= 50) return 'Level 4 - Adequate Achievement (50–59%)';
  if (percentage >= 40) return 'Level 3 - Moderate Achievement (40–49%)';
  if (percentage >= 30) return 'Level 2 - Elementary Achievement (30–39%)';
  return 'Level 1 - Not Achieved (0–29%)';
}
