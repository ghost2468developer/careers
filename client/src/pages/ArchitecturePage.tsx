import React, { useState } from 'react';
import {
  Code2,
  FolderTree,
  Play,
  Database,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { graphqlRequest } from '../lib/graphql';

const MODULE_DOCS = [
  {
    name: 'exam',
    schemaPath: 'api/src/components/exam/schema.graphql.ts',
    resolversPath: 'api/src/components/exam/resolvers.ts',
    roleGuard: 'requireAuth(context) · Grade 10/11/12 Scoped',
    operations: [
      'Query.examPapersForGrade(grade, subject)',
      'Query.examPaperById(id)',
      'Query.myAcademicProgress(grade)',
      'Query.myExamAttempts(grade, subject)',
      'Mutation.checkSingleQuestion(questionId, studentAnswer)',
      'Mutation.submitExamAttempt(input)',
    ],
  },
  {
    name: 'admin',
    schemaPath: 'api/src/components/admin/schema.graphql.ts',
    resolversPath: 'api/src/components/admin/resolvers.ts',
    roleGuard: 'requireAdmin(context)',
    operations: [
      'Query.adminStats',
      'Query.adminLearnerProgressList(grade, search)',
      'Query.adminAllExamPapers(grade, subject)',
      'Query.adminAllExamAttempts(grade, subject, userId)',
      'Mutation.adminCreateExamPaper(input)',
      'Mutation.adminReviewAttempt(attemptId, teacherFeedback, adjustedScore)',
      'Mutation.adminUpdateLearnerGrade(userId, grade)',
      'Mutation.adminCreateUser / adminUpdateUserRole / adminDeleteUser',
    ],
  },
  {
    name: 'auth & user',
    schemaPath: 'api/src/components/{auth,user}/schema.graphql.ts',
    resolversPath: 'api/src/components/{auth,user}/resolvers.ts',
    roleGuard: 'JWT + Role & Grade Context',
    operations: [
      'Mutation.register(input) [with Grade 10/11/12]',
      'Mutation.login(input) / forgotPassword / resetPassword',
      'Mutation.setLearnerGrade(grade)',
      'Mutation.updateProfile(input) / changePassword(input)',
    ],
  },
];

const SAMPLE_QUERIES: Record<string, string> = {
  'Grade 10 Exam Papers Only': `query GetGrade10Papers {
  examPapersForGrade(grade: 10) {
    id
    title
    subject
    grade
    totalMarks
    questionCount
  }
}`,
  'Grade 12 Matric Papers Only': `query GetGrade12Papers {
  examPapersForGrade(grade: 12) {
    id
    title
    subject
    grade
    totalMarks
    questionCount
  }
}`,
  'Admin Academic Stats (ADMIN role)': `query GetAdminAcademicStats {
  adminStats {
    userCount
    grade10Learners
    grade11Learners
    grade12Learners
    totalExamPapers
    totalQuestions
    totalExamAttempts
    overallAveragePercentage
  }
}`,
};

export const ArchitecturePage: React.FC = () => {
  const [queryText, setQueryText] = useState(
    SAMPLE_QUERIES['Grade 10 Exam Papers Only']
  );
  const [responseJson, setResponseJson] = useState<string>(
    '// Click "Execute GraphQL Query" to run against /graphql'
  );
  const [running, setRunning] = useState(false);

  const handleRunQuery = async () => {
    setRunning(true);
    try {
      const data = await graphqlRequest(queryText);
      setResponseJson(JSON.stringify({ data }, null, 2));
    } catch (err) {
      setResponseJson(
        JSON.stringify(
          { error: err instanceof Error ? err.message : 'GraphQL Error' },
          null,
          2
        )
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-sky-400">
          <Code2 className="h-4 w-4" />
          MODULAR GRAPHQL ARCHITECTURE
        </div>
        <h1 className="mt-1.5 text-2xl font-bold text-white">
          Component-Based GraphQL Schema & Resolvers
        </h1>
        <p className="mt-1 text-xs text-slate-400 max-w-3xl">
          Every backend feature module lives under{' '}
          <code className="text-sky-300">api/src/components/&lt;feature&gt;/</code> with its
          own <code className="text-emerald-300">schema.graphql.ts</code> and{' '}
          <code className="text-indigo-300">resolvers.ts</code>, merged automatically in{' '}
          <code className="text-amber-300">api/src/components/index.ts</code>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {MODULE_DOCS.map((mod) => (
          <div
            key={mod.name}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 px-2.5 py-1 font-mono text-xs font-bold text-indigo-300">
                  <FolderTree className="h-3.5 w-3.5" />
                  src/components/{mod.name}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium text-slate-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  {mod.roleGuard}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 rounded-xl border border-slate-800/90 bg-slate-950 p-3 font-mono text-[11px]">
                <div className="text-emerald-300">📄 {mod.schemaPath}</div>
                <div className="text-sky-300">⚡ {mod.resolversPath}</div>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  GraphQL Operations
                </p>
                <ul className="space-y-1">
                  {mod.operations.map((op) => (
                    <li
                      key={op}
                      className="flex items-center gap-1.5 font-mono text-xs text-slate-300"
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                      {op}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Interactive GraphQL Runner (/graphql)
              </h2>
              <p className="text-xs text-slate-400">
                Uses your current JWT session header automatically
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Object.keys(SAMPLE_QUERIES).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setQueryText(SAMPLE_QUERIES[label])}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-white"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleRunQuery}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Execute GraphQL Query
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              GraphQL Operation
            </label>
            <textarea
              rows={11}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-emerald-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              JSON Response from PostgreSQL + Apollo Server
            </label>
            <pre className="h-[246px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-sky-300">
              {responseJson}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
