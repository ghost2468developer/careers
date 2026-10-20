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
  X,
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
  const [instantChecks, setInstantChecks] = useState<Record<string, InstantCheckResult>>(
    {}
  );
  const [checkingQuestionId, setCheckingQuestionId] = useState<string | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAttempt, setSubmittedAttempt] = useState<ExamAttempt | null>(null);

  // Floating Answering Tips Guide inside the Exam/Quiz Runner
  const [showAnsweringGuide, setShowAnsweringGuide] = useState(false);

  useEffect(() => {
    if (!paperId) return;
    setLoading(true);
    graphqlRequest<{ examPaperById: ExamPaper | null }>(
      EXAM_OPERATIONS.GET_EXAM_PAPER,
      { id: paperId }
    )
      .then((data) => {
        if (!data.examPaperById) {
          setError('Assessment not found.');
        } else {
          setPaper(data.examPaperById);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
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
      setError(err instanceof Error ? err.message : 'Failed to submit attempt');
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
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">Loading your questions...</p>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-base font-semibold text-rose-400">
          {error || 'Assessment not found'}
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Study Space
        </Link>
      </div>
    );
  }

  const subjectMeta = SUBJECT_METADATA[paper.subject];
  const answeredCount = paper.questions.filter(
    (q) => (answers[q.id] || '').trim().length > 0
  ).length;
  const progressPercent = Math.round((answeredCount / paper.questions.length) * 100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Grade {paper.grade}
        </Link>

        {!submittedAttempt && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAnsweringGuide(!showAnsweringGuide)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-300" />
              How to Answer Tips
            </button>

            <div className="inline-flex rounded-2xl border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setMode('REVISION')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  mode === 'REVISION'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Practice Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('EXAM')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  mode === 'EXAM'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Timed Mode
              </button>
            </div>

            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-mono font-bold text-amber-300">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(elapsedSeconds)}
            </div>
          </div>
        )}
      </div>

      {/* Friendly Paper Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-extrabold text-emerald-300">
            Grade {paper.grade}
          </span>
          <span
            className={`rounded-xl border px-3 py-0.5 text-xs font-bold ${subjectMeta.badgeClass}`}
          >
            {subjectMeta.label}
          </span>
          <span
            className={`rounded-xl border px-3 py-0.5 text-xs font-extrabold ${
              paper.assessmentType === 'EXAM'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {paper.assessmentType === 'EXAM'
              ? 'Past Paper Exam · 150 Marks · 10 Questions'
              : 'Revision Quiz · 100 Marks · 10 Questions'}
          </span>
        </div>

        <h1 className="mt-3 text-xl sm:text-2xl font-extrabold text-white">
          {paper.title}
        </h1>
        {paper.pastPaperSource && (
          <p className="mt-1 text-xs font-medium text-sky-300">
            📄 {paper.pastPaperSource}
          </p>
        )}
      </div>

      {/* =================================================================== */}
      {/* VIEW 1: GRADED REPORT CARD (After Submission)                       */}
      {/* =================================================================== */}
      {submittedAttempt ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-extrabold text-emerald-300">
                  <Award className="h-4 w-4" />
                  YOUR GRADED RESULTS
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {submittedAttempt.scoreEarned} / {submittedAttempt.totalMarks} Marks (
                  {submittedAttempt.percentage}%)
                </h2>
                <p className="text-sm font-bold text-amber-300">
                  {submittedAttempt.gradeSymbol}
                </p>
                <p className="text-xs text-slate-400">
                  Time Spent: {formatTime(submittedAttempt.timeSpentSeconds)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleRetryPaper}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
                >
                  Back to Grade {paper.grade}
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-white">
              Your Worked Answers & Marking Memorandum
            </h3>

            {submittedAttempt.answers.map((ans) => (
              <div
                key={ans.id}
                className={`rounded-3xl border p-6 space-y-4 ${
                  ans.isCorrect
                    ? 'border-emerald-500/30 bg-slate-900/90'
                    : ans.isPartial
                    ? 'border-amber-500/30 bg-slate-900/90'
                    : 'border-rose-500/30 bg-slate-900/90'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-slate-800 px-3 py-1 text-xs font-extrabold text-white">
                      Question {ans.questionNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-300">
                      {ans.questionTopic}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      ans.isCorrect
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : ans.isPartial
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {ans.marksEarned} / {ans.maxMarks} Marks
                  </span>
                </div>

                <p className="text-sm font-semibold text-white">{ans.questionPrompt}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
                    <p className="text-[11px] font-bold uppercase text-slate-400">
                      Your Answer
                    </p>
                    <p className="mt-1 text-xs text-slate-200">
                      {ans.studentAnswer || '(Blank)'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
                    <p className="text-[11px] font-bold uppercase text-emerald-400">
                      Correct Answer
                    </p>
                    <p className="mt-1 text-xs text-emerald-100">{ans.correctAnswer}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-xs space-y-1.5">
                  <p className="font-bold text-indigo-300">{ans.gradingFeedback}</p>
                  <p className="text-slate-200 leading-relaxed">
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
        /* VIEW 2: FRIENDLY QUESTION RUNNER                                    */
        /* =================================================================== */
        <form onSubmit={handleSubmitExam} className="space-y-6">
          {/* Visual Progress Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">
                Progress: {answeredCount} of {paper.questions.length} Questions Answered
              </span>
              <span className="font-bold text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {paper.questions.map((q) => {
            const currentVal = answers[q.id] || '';
            const checkResult = instantChecks[q.id];

            return (
              <div
                key={q.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg space-y-4"
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-xs font-extrabold text-slate-950">
                      Q{q.questionNumber}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white">{q.topic}</span>
                      <span className="ml-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                        {QUESTION_TYPE_LABELS[q.type]}
                      </span>
                    </div>
                  </div>

                  <span className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-extrabold text-amber-300">
                    {q.marks} Marks
                  </span>
                </div>

                {/* Question Prompt */}
                <p className="text-sm sm:text-base font-bold leading-relaxed text-white">
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
                          className={`flex items-center justify-between rounded-2xl border p-4 text-left text-xs font-bold transition ${
                            selected
                              ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-sm'
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
                          className={`flex items-center justify-center gap-2 rounded-2xl border py-3.5 px-4 text-xs font-extrabold transition ${
                            selected
                              ? 'border-emerald-400 bg-emerald-500/20 text-white'
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
                      💡 Type your final number (you can also write your working steps):
                    </label>
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold text-emerald-300 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {q.type === 'EXPLAIN' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-indigo-300">
                      💡 Explain in your own words (include key terms for full marks):
                    </label>
                    <textarea
                      rows={3}
                      value={currentVal}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Write your explanation here..."
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Instant Check & Explain Button (in Practice Mode) */}
                {mode === 'REVISION' && (
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={checkingQuestionId === q.id}
                      onClick={() => handleInstantCheck(q)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {checkingQuestionId === q.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Check Answer & See Explanation
                    </button>
                  </div>
                )}

                {/* Instant Check Feedback Panel */}
                {checkResult && (
                  <div
                    className={`mt-3 rounded-2xl border p-4 space-y-2.5 ${
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
                      <span className="rounded-full bg-slate-950 px-3 py-0.5 text-xs font-extrabold text-emerald-300">
                        {checkResult.marksEarned} / {checkResult.maxMarks} Marks
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-xs space-y-1.5">
                      <p className="text-emerald-300">
                        <strong>Model Answer:</strong> {checkResult.correctAnswer}
                      </p>
                      <p className="text-slate-200 leading-relaxed">
                        <strong className="text-sky-300">
                          <BookOpen className="inline h-3.5 w-3.5 mr-1" />
                          Explanation:{' '}
                        </strong>
                        {checkResult.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Full Paper Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-emerald-500/40 bg-slate-900 p-6 shadow-xl">
            <div>
              <h3 className="text-base font-extrabold text-white">
                Finished? Submit to Get Your Total Score!
              </h3>
              <p className="text-xs text-slate-400">
                We will mark all {paper.questions.length} questions out of {paper.totalMarks}{' '}
                marks and show you the full worked memorandum.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit & Mark ({paper.totalMarks} Marks)
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* FLOATING ANSWERING GUIDE BUTTON & POPUP CARD                        */}
      {/* =================================================================== */}
      {!showAnsweringGuide ? (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setShowAnsweringGuide(true)}
            className="flex items-center gap-2 rounded-full border border-emerald-400/50 bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs font-extrabold text-white shadow-2xl shadow-emerald-600/40 transition-all hover:scale-105"
          >
            <HelpCircle className="h-4 w-4" />
            <span>How to Answer · Guide</span>
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
          </button>
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border-2 border-emerald-400/60 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Quick Answering Guide
            </span>
            <button
              type="button"
              onClick={() => setShowAnsweringGuide(false)}
              className="rounded-xl bg-slate-800 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="rounded-xl bg-slate-950/80 p-2.5">
              <strong className="text-emerald-300">1. Multiple Choice & True/False:</strong>{' '}
              Simply tap the option you want to select.
            </li>
            <li className="rounded-xl bg-slate-950/80 p-2.5">
              <strong className="text-amber-300">2. Calculations (Numeric):</strong> Type
              the final number (e.g. <code>12</code>) or include your formula steps for
              method marks!
            </li>
            <li className="rounded-xl bg-slate-950/80 p-2.5">
              <strong className="text-indigo-300">3. Explain Questions:</strong> Write a
              short sentence using key subject terms - our marker awards partial or full
              marks automatically!
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setShowAnsweringGuide(false)}
            className="w-full rounded-xl bg-emerald-500 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
          >
            Got It!
          </button>
        </div>
      )}
    </div>
  );
};
