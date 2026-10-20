import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Award,
  HelpCircle,
  Loader2,
  Send,
  RotateCcw,
} from 'lucide-react';
import {
  EXAM_OPERATIONS,
  ExamAttempt,
  ExamPaper,
  ExamQuestion,
  graphqlRequest,
  InstantCheckResult,
  QUESTION_TYPE_LABELS,
  SUBJECT_METADATA,
} from '../lib/graphql';

export const ExamPrepSessionPage: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'EXAM' ? 'EXAM' : 'REVISION';

  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'REVISION' | 'EXAM'>(initialMode);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [instantChecks, setInstantChecks] = useState<Record<string, InstantCheckResult>>({});
  const [checkingQuestionId, setCheckingQuestionId] = useState<string | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAttempt, setSubmittedAttempt] = useState<ExamAttempt | null>(null);

  useEffect(() => {
    if (!paperId) return;
    setLoading(true);
    graphqlRequest<{ examPaperById: ExamPaper | null }>(
      EXAM_OPERATIONS.GET_EXAM_PAPER,
      { id: paperId }
    )
      .then((data) => {
        if (!data.examPaperById) {
          setError('Exam paper not found.');
        } else {
          setPaper(data.examPaperById);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load exam paper');
      })
      .finally(() => setLoading(false));
  }, [paperId]);

  // Timer
  useEffect(() => {
    if (!paper || submittedAttempt) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [paper, submittedAttempt]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleInstantCheck = async (question: ExamQuestion) => {
    const studentAnswer = answers[question.id] || '';
    setCheckingQuestionId(question.id);
    try {
      const data = await graphqlRequest<{ checkSingleQuestion: InstantCheckResult }>(
        EXAM_OPERATIONS.CHECK_SINGLE_QUESTION,
        {
          questionId: question.id,
          studentAnswer,
        }
      );
      setInstantChecks((prev) => ({
        ...prev,
        [question.id]: data.checkSingleQuestion,
      }));
    } catch (err) {
      console.error('Error checking single question:', err);
    } finally {
      setCheckingQuestionId(null);
    }
  };

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paper) return;
    setSubmitting(true);
    setError(null);

    try {
      const formattedAnswers = paper.questions.map((q) => ({
        questionId: q.id,
        studentAnswer: answers[q.id] || '',
      }));

      const data = await graphqlRequest<{ submitExamAttempt: ExamAttempt }>(
        EXAM_OPERATIONS.SUBMIT_EXAM_ATTEMPT,
        {
          input: {
            examPaperId: paper.id,
            mode,
            timeSpentSeconds: elapsedSeconds,
            answers: formattedAnswers,
          },
        }
      );

      setSubmittedAttempt(data.submitExamAttempt);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exam attempt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryPaper = () => {
    setSubmittedAttempt(null);
    setAnswers({});
    setInstantChecks({});
    setElapsedSeconds(0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm">Loading Exam Prep Paper & Grading Rubric...</p>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-base font-semibold text-rose-400">
          {error || 'Exam paper not found'}
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exam Prep Portal
        </Link>
      </div>
    );
  }

  const subjectMeta = SUBJECT_METADATA[paper.subject];
  const answeredCount = paper.questions.filter(
    (q) => (answers[q.id] || '').trim().length > 0
  ).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Navigation & Paper Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Grade {paper.grade} Exam Preps
        </Link>

        {!submittedAttempt && (
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setMode('REVISION')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  mode === 'REVISION'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Revision & Explain Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('EXAM')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  mode === 'EXAM'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Timed Exam Mode
              </button>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-mono text-amber-300">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(elapsedSeconds)} / {paper.durationMinutes}:00
            </div>
          </div>
        )}
      </div>

      {/* Exam Paper Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-bold text-emerald-300">
            GRADE {paper.grade}
          </span>
          <span
            className={`rounded-full border px-3 py-0.5 text-xs font-bold ${subjectMeta.badgeClass}`}
          >
            {subjectMeta.label}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
            Term {paper.term} · {paper.year}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
            Total: {paper.totalMarks} Marks ({paper.questions.length} Questions)
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold text-white">{paper.title}</h1>
        <p className="mt-1 text-xs text-slate-400">{paper.description}</p>
      </div>

      {/* =================================================================== */}
      {/* VIEW 1: GRADED EXAM REPORT CARD (After Submission)                  */}
      {/* =================================================================== */}
      {submittedAttempt ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-6 shadow-xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                  <Award className="h-4 w-4" />
                  OFFICIAL EXAM PREP REPORT CARD
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  You Scored {submittedAttempt.scoreEarned} / {submittedAttempt.totalMarks}{' '}
                  Marks ({submittedAttempt.percentage}%)
                </h2>
                <p className="text-sm font-semibold text-amber-300">
                  CAPS Achievement: {submittedAttempt.gradeSymbol}
                </p>
                <p className="text-xs text-slate-400">
                  Mode: {submittedAttempt.mode} · Time Spent:{' '}
                  {formatTime(submittedAttempt.timeSpentSeconds)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleRetryPaper}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry This Exam Paper
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Return to Grade {paper.grade} Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Question-by-Question Graded Memorandum & Explanations */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">
              Detailed Question-by-Question Memorandum & Explanations
            </h3>

            {submittedAttempt.answers.map((ans) => (
              <div
                key={ans.id}
                className={`rounded-2xl border p-6 space-y-4 ${
                  ans.isCorrect
                    ? 'border-emerald-500/30 bg-slate-900/90'
                    : ans.isPartial
                    ? 'border-amber-500/30 bg-slate-900/90'
                    : 'border-rose-500/30 bg-slate-900/90'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-white">
                      Question {ans.questionNumber}
                    </span>
                    <span className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
                      {QUESTION_TYPE_LABELS[ans.questionType]}
                    </span>
                    <span className="text-xs text-slate-400">· {ans.questionTopic}</span>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      ans.isCorrect
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : ans.isPartial
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {ans.marksEarned} / {ans.maxMarks} Marks
                  </span>
                </div>

                <p className="text-sm font-semibold text-white">{ans.questionPrompt}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Your Submitted Answer
                    </p>
                    <p className="mt-1 text-xs text-slate-200 whitespace-pre-wrap">
                      {ans.studentAnswer || '(No answer entered)'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                      Official Memorandum Answer
                    </p>
                    <p className="mt-1 text-xs text-emerald-100 whitespace-pre-wrap">
                      {ans.correctAnswer}
                    </p>
                  </div>
                </div>

                {/* Rubric Concept Breakdown */}
                {(ans.matchedKeywords.length > 0 || ans.missedKeywords.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Marking Rubric Breakdown:
                    </span>
                    {ans.matchedKeywords.map((kw, i) => (
                      <span
                        key={`hit-${i}`}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] text-emerald-300"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                    {ans.missedKeywords.map((kw, i) => (
                      <span
                        key={`miss-${i}`}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[11px] text-rose-300"
                      >
                        ✗ Missed: {kw}
                      </span>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                  <p className="text-xs font-semibold text-indigo-300">
                    Grading Feedback: {ans.gradingFeedback}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200">
                    <strong className="text-sky-300">Step-by-Step Explanation: </strong>
                    {ans.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* =================================================================== */
        /* VIEW 2: ACTIVE INTERACTIVE EXAM PREP / REVISION QUESTIONS           */
        /* =================================================================== */
        <form onSubmit={handleSubmitExam} className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs">
            <span className="text-slate-300">
              Answered{' '}
              <strong className="text-emerald-400">{answeredCount}</strong> of{' '}
              <strong className="text-white">{paper.questions.length}</strong> questions
            </span>
            <span className="text-slate-400">
              {mode === 'REVISION'
                ? 'Tip: Click "Check & Explain Question" on any question for instant rubric grading!'
                : 'Timed Exam Mode: Complete all questions and submit at the bottom.'}
            </span>
          </div>

          {paper.questions.map((q) => {
            const currentVal = answers[q.id] || '';
            const checkResult = instantChecks[q.id];

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-lg space-y-4"
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                      Q{q.questionNumber}
                    </span>
                    <span className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                      {QUESTION_TYPE_LABELS[q.type]}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Topic: <strong className="text-slate-200">{q.topic}</strong>
                    </span>
                  </div>

                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-xs font-bold text-amber-300">
                    [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                  </span>
                </div>

                {/* Question Prompt */}
                <p className="text-sm sm:text-base font-semibold leading-relaxed text-white">
                  {q.prompt}
                </p>

                {/* Input Control based on QuestionType */}
                {q.type === 'MULTIPLE_CHOICE' && (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {q.options.map((opt) => {
                      const selected = currentVal === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, opt)}
                          className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-xs font-medium transition ${
                            selected
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200 shadow-sm'
                              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {selected && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'TRUE_FALSE' && (
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    {['True', 'False'].map((tf) => {
                      const selected = currentVal === tf;
                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, tf)}
                          className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-4 text-xs font-bold transition ${
                            selected
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200'
                              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {tf}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'NUMERIC' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400">
                      Enter your calculated numerical value (or working steps + final answer):
                    </label>
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="e.g. 12 (or show working: 5 × 2.4 = 12)"
                      className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-mono text-emerald-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {q.type === 'EXPLAIN' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5 text-indigo-300 font-medium">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Structured Explain Question - Graded against {q.rubricKeywords.length}{' '}
                        key curriculum concepts
                      </span>
                      <span>{currentVal.trim().split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                    <textarea
                      rows={4}
                      value={currentVal}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Write your full explanation here. Mention key scientific/mathematical terms to earn all rubric marks..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Instant Check & Explain Button (in Revision Mode) */}
                {mode === 'REVISION' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={checkingQuestionId === q.id}
                      onClick={() => handleInstantCheck(q)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {checkingQuestionId === q.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Check & Explain This Question
                    </button>
                  </div>
                )}

                {/* Instant Check Feedback Panel */}
                {checkResult && (
                  <div
                    className={`mt-3 rounded-xl border p-4 space-y-3 ${
                      checkResult.isCorrect
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : checkResult.isPartial
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-rose-500/30 bg-rose-500/10'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        {checkResult.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                        )}
                        <span>{checkResult.gradingFeedback}</span>
                      </div>
                      <span className="rounded-full bg-slate-950 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                        {checkResult.marksEarned} / {checkResult.maxMarks} Marks
                      </span>
                    </div>

                    {(checkResult.matchedKeywords.length > 0 ||
                      checkResult.missedKeywords.length > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {checkResult.matchedKeywords.map((kw, idx) => (
                          <span
                            key={`m-${idx}`}
                            className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-200"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                        {checkResult.missedKeywords.map((kw, idx) => (
                          <span
                            key={`x-${idx}`}
                            className="rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-200"
                          >
                            ✗ Rubric concept: {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3 text-xs space-y-1.5">
                      <p className="text-emerald-300">
                        <strong>Model Answer:</strong> {checkResult.correctAnswer}
                      </p>
                      <p className="text-slate-300 leading-relaxed">
                        <strong className="text-sky-300">
                          <BookOpen className="inline h-3.5 w-3.5 mr-1" />
                          Worked Explanation:{' '}
                        </strong>
                        {checkResult.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Full Exam Paper Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-slate-900 p-6">
            <div>
              <h3 className="text-base font-bold text-white">
                Ready to Grade Your Complete Exam Paper?
              </h3>
              <p className="text-xs text-slate-400">
                Submits your answers to the grading engine, calculates your CAPS Level 1–7 symbol,
                and saves your progress for your Grade {paper.grade} record.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Grading Exam Paper...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit & Grade Exam Paper ({paper.totalMarks} Marks)
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
