# MatricPrep - Grade 10–12 Academic Exam Preparation & Revision Platform

A full-stack **React + Node.js + TypeScript + GraphQL + Prisma ORM + PostgreSQL** web application designed for **Grade 10, Grade 11, and Grade 12 (Matric)** learners and educators (`ADMIN`).

---

## Key Features Implemented

### 1. Strict Grade-Scoped Learner Experience (`Grade 10`, `Grade 11`, `Grade 12`)
- Learners (`USER` role) select their grade at registration or switch their active grade on their dashboard:
  - Selecting **Grade 10** shows **only Grade 10** exam preps, subjects, and Grade 10 progress.
  - Selecting **Grade 11** shows **only Grade 11** exam preps, subjects, and Grade 11 progress.
  - Selecting **Grade 12** shows **only Grade 12 (Matric)** exam preps, subjects, and Grade 12 progress.

### 2. Core Subjects (Pre-Seeded across Grade 10, 11 & 12 = 15 Complete Exam Prep Papers)
1. **Mathematics** (`MATHEMATICS`)
2. **Mathematical Literacy** (`MATHEMATICAL_LITERACY`)
3. **Physical Sciences** (`PHYSICAL_SCIENCES`)
4. **Life Sciences** (`LIFE_SCIENCES`)
5. **Geography** (`GEOGRAPHY`)

### 3. Variety of Question Types & Multi-Criteria Grading Engine (`api/src/lib/grading.ts`)
- **`MULTIPLE_CHOICE`**: 4-option questions (`A`, `B`, `C`, `D`) auto-graded with full worked explanations.
- **`NUMERIC`**: Calculation & formula questions with method-mark support and step-by-step solutions.
- **`TRUE_FALSE`**: Conceptual verification questions with detailed explanations.
- **`EXPLAIN` (Structured / Long-Answer Explain Questions)**:
  - Graded against official **Marking Rubric Concepts (`rubricKeywords`)**.
  - Awards full or partial marks (`0.5` mark precision) based on which key curriculum concepts the learner explained.
  - Displays a visual **Rubric Breakdown** (`✓ Concepts Included` vs `✗ Concepts Missed for Full Marks`) alongside the **Official Model Answer** and **Step-by-Step Worked Explanation**.
- **Two Practice Modes**:
  - **Practice & Explain Mode (`REVISION`)**: Check and grade individual questions on the spot (`checkSingleQuestion` mutation) with instant rubric feedback & explanations.
  - **Timed Exam Mode (`EXAM`)**: Full exam simulation with timer and a complete **CAPS Level 1–7 Report Card** (`submitExamAttempt` mutation).

### 4. Admin Academic Command Center (`/admin`)
- **Monitor All Learners' Progress**: View every learner's enrolled Grade (`10`, `11`, `12`), completed exam attempts, average score %, best score %, CAPS Achievement Level, strongest subject, and weakest subject.
- **Inspect Learner Exam Scripts & Add Teacher Feedback**: Open any learner's submitted exam attempt to inspect their answers question-by-question, write educator feedback, or adjust marks (`adminReviewAttempt`).
- **Upload / Build Exam Prep Papers**: Upload an exam file (`.json` / `.txt`) or use the interactive **Multi-Question Exam Paper Builder** (`adminCreateExamPaper`) to publish new papers for Grade 10, 11, or 12.

---

## Modular GraphQL API Structure (`api/src/components/`)

```text
api/src/components/
├── index.ts                         # Merges all component typeDefs & resolvers
├── auth/
│   ├── schema.graphql.ts            # Register (with Grade 10/11/12), Login, Forgot/Reset Password
│   └── resolvers.ts
├── user/
│   ├── schema.graphql.ts            # MyProfile, SetLearnerGrade(10|11|12), UpdateProfile, ChangePassword
│   └── resolvers.ts
├── exam/
│   ├── schema.graphql.ts            # ExamPapersForGrade, MyAcademicProgress, CheckSingleQuestion, SubmitExamAttempt
│   └── resolvers.ts
└── admin/
    ├── schema.graphql.ts            # AdminStats, AdminLearnerProgressList, AdminCreateExamPaper, AdminReviewAttempt
    └── resolvers.ts
```

---

## Seeded Demo Accounts

| Role | Grade | Name | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | All (10–12) | Principal N. Mbeki | `admin@example.com` | `Admin123!` |
| **USER (Learner)** | **Grade 10** | Thabo Mokoena | `user@example.com` | `User123!` |
| **USER (Learner)** | **Grade 11** | Lerato Ndlovu | `lerato@example.com` | `User123!` |
| **USER (Learner)** | **Grade 12** | Sipho Dlamini | `sipho@example.com` | `User123!` |
