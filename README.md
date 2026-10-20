# NexusRBAC - Full-Stack React + Node.js + TypeScript + GraphQL + Prisma + PostgreSQL

## Tech Stack
- **Frontend (`client/`)**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- **Backend (`api/`)**: Node.js, TypeScript, Express, Apollo Server (GraphQL), JWT, bcryptjs
- **Database & ORM (`api/prisma/`)**: PostgreSQL + Prisma ORM

---

## Modular GraphQL API Structure (`schema.graphql.ts` + `resolvers.ts`)

Every domain module on the API lives under `api/src/components/<module>/` with its own `schema.graphql.ts` and `resolvers.ts`:

```text
api/
├── prisma/
│   ├── schema.prisma                # PostgreSQL models: User, Role (ADMIN | USER), PasswordResetToken, AuditLog
│   └── seed.ts                      # Seeds initial ADMIN and USER accounts
└── src/
    ├── index.ts                     # Express + Apollo Server entry point (/graphql & /api/health)
    ├── lib/
    │   ├── prisma.ts                # PrismaClient singleton
    │   └── auth.ts                  # JWT sign/verify, bcrypt hashing, requireAuth & requireAdmin guards
    ├── types/
    │   └── context.ts               # Typed GraphQLContext { prisma, user }
    └── components/
        ├── index.ts                 # Merges typeDefs & resolvers across all components
        ├── auth/
        │   ├── schema.graphql.ts    # Register, Login, ForgotPassword, VerifyResetToken, ResetPassword, Me
        │   └── resolvers.ts
        ├── user/
        │   ├── schema.graphql.ts    # MyProfile, MyAuditLogs, UpdateProfile, ChangePassword
        │   └── resolvers.ts
        └── admin/
            ├── schema.graphql.ts    # AdminStats, AdminUsers, AdminResetTokens, AdminAuditLogs, User & Role CRUD
            └── resolvers.ts
```

### Adding New Feature Modules Later
To add a new feature (e.g., `projects`, `billing`, `notifications`):
1. Create `api/src/components/<feature>/schema.graphql.ts`
2. Create `api/src/components/<feature>/resolvers.ts`
3. Register both in `api/src/components/index.ts`

---

## Seeded Default Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **ADMIN** | `admin@example.com` | `Admin123!` |
| **USER** | `user@example.com` | `User123!` |
| **USER** | `sarah@example.com` | `User123!` |
