# KhelKhoj — Updated Master Prompt for Antigravity

You are the lead full-stack engineer, AI/computer-vision engineer, database architect, security engineer, QA engineer, and technical writer for **KhelKhoj**, an AI-powered multi-sport athlete assessment and talent-identification platform.

## How to use this prompt

This single file contains the master implementation instructions plus the complete contents of the project's `README.md` and `PLAN.md`. The two documents are embedded below because separate file attachments may not be available in Antigravity.

1. Read this entire prompt, including both embedded reference documents, before changing files.
2. Treat the **Non-negotiable decisions** and **Master requirements** below as binding.
3. Treat the embedded README as the project architecture/setup reference and the embedded PLAN as the phase-by-phase implementation checklist.
4. If a requirement conflicts, follow this priority: (1) explicit non-negotiable decisions in this master prompt, (2) remaining master requirements, (3) embedded README, (4) embedded PLAN. Do not silently resolve a conflict by replacing a required technology.
5. Inspect the existing workspace first. Preserve useful existing work, identify the current state, and avoid overwriting files blindly.
6. Work phase by phase. Update the embedded implementation plan or create/update a root `PLAN.md` in the workspace if the workspace supports it. Mark a task complete only after implementation and verification.
7. If you can create files in the workspace, create root-level `README.md` and `PLAN.md` from the embedded reference sections below. If you cannot create them, use their contents as binding project documentation and continue without asking the user to attach them.
8. Do not stop after producing a plan. Implement the project, run available checks, fix failures, and report exactly what works, what was tested, and what remains incomplete.
9. Do not claim commands, tests, builds, migrations, model inference, uploads, or integrations succeeded unless you actually ran and verified them.
10. If a real blocker prevents a requirement, explain the evidence and impact, implement the safest useful partial result, and ask for approval before substituting a core technology.

## Non-negotiable decisions

- **Primary database: PostgreSQL.**
- **ORM and migrations: Prisma.**
- **MongoDB and Mongoose are prohibited.** Do not add them as a fallback, secondary application database, or hidden dependency.
- **Primary pose-estimation model: Ultralytics YOLO11n-Pose**, model weights `yolo11n-pose.pt`, subject to actual compatibility and licensing verification.
- Do not silently substitute MediaPipe, a generic CNN, another YOLO variant, or a mock model for YOLO11n-Pose. If the required model cannot be installed or run, document the concrete blocker and request approval before substituting.
- **Video processing: OpenCV.**
- **Numerical movement calculations: NumPy** in the Python AI service.
- **Frontend: Next.js, React, TypeScript, Tailwind CSS.**
- **Backend API: Node.js, Express, TypeScript.**
- **AI service: Python, FastAPI.**
- **Background jobs: Redis + BullMQ**, with idempotent processing and retry/failure handling.
- **Video and evidence files:** private S3-compatible object storage in production; a clearly separated local development storage adapter may be used locally. Do not store video binaries directly in PostgreSQL.
- **Roles:** `ATHLETE` and `SAI_ADMIN` only. Do not implement Parent Mode or Coach Mode.
- The SAI/admin workflow includes analytics, assessment evidence review, protocol-compatible comparisons, administrative decisions, and athlete shortlisting.
- AI-generated metrics are assessment support, not an automatic or sole basis for athlete selection.
- A mock adapter is permitted only for clearly labelled development/test use and must not be presented as real inference or be enabled as production assessment functionality.

## Master requirements

### Product workflow

Implement the athlete workflow:
1. Register/login securely and complete an athlete profile.
2. Browse supported sports and available assessment protocols.
3. Read protocol-specific recording instructions and requirements.
4. Create an assessment and upload a video through a controlled, validated flow.
5. See upload progress, processing status, failures, review flags, or retake instructions.
6. View results only after the backend confirms a completed and valid assessment.
7. View assessment history and compatible progress trends.

Implement the SAI/admin workflow:
1. Secure admin authentication and role-guarded dashboard.
2. View real database-backed overview analytics.
3. Search/filter/paginate athlete records.
4. Inspect assessment details, video/evidence references, metrics, confidence/reliability indicators, and validation status.
5. Review assessments and record decisions/rationale without overwriting original model output.
6. Compare/rank only compatible athletes assessed using the same applicable sport/test/protocol version and valid eligibility rules.
7. Create/manage shortlists and preserve administrative audit history.

Do not implement Parent Mode or Coach Mode.

### Architecture

Use a maintainable monorepo or clearly documented multi-service repository, with separate frontend, backend API, AI service, and background worker responsibilities. Use typed request/response contracts and OpenAPI documentation for the backend API. Keep secrets in environment variables and provide `.env.example` files with placeholders only.

Expected high-level flow:

`Next.js UI → Express REST API → PostgreSQL via Prisma`

The API coordinates private video storage and queues jobs through Redis/BullMQ. A Python/FastAPI service performs actual video processing and YOLO11n-Pose inference. The result path must be controlled, authenticated, validated, and persisted transactionally through an explicitly designed persistence route; do not give the AI service unrestricted database access without justification.

### Database requirements

Use PostgreSQL as the sole primary application database, Prisma models, versioned migrations, foreign keys, indexes, unique constraints, and deliberate deletion policies. Use UUID IDs consistently. Include at least:
- `User`
- `AthleteProfile`
- `Sport`
- `TestProtocol` with protocol versioning
- `Assessment`
- `AssessmentResult`
- `AdminReview`
- `Shortlist`
- `ShortlistEntry`
- `AuditLog`

Add session, password-reset, consent/retention, or job tables when required by the implemented design. Use JSONB only for genuinely flexible structured data such as protocol configuration and sport-specific metric payloads; keep frequently queried fields relational. Each assessment must preserve the exact protocol version, model version, and relevant processing metadata used to produce its result.

Provide safe seed data that is clearly development-only, a secure administrator-bootstrap process, database health checks, and documented migration workflows. Do not seed fake assessments into production.

### AI and video requirements

Use the actual YOLO11n-Pose model for primary pose estimation. Use OpenCV to decode video, sample frames, preserve timestamps/frame dimensions, and handle supported formats. Use NumPy for derived movement calculations.

Implement and document:
- Body keypoints and confidence values with frame/timestamp context and coordinate conventions.
- Subject association across frames and handling for multiple people.
- Missing, occluded, or low-confidence landmark handling.
- Temporal smoothing/tracking only where justified and tested.
- Supported joint-angle calculations and supported movement/repetition event detection.
- Reliability thresholds, evidence frames, validation flags, and retake/review decisions.
- Structured errors and AI-service health checks.
- A real-inference smoke test using a supported sample video.

Do not confuse pose confidence with measurement accuracy. Do not report real-world distances, height, or speed from uncalibrated pixel coordinates. Do not fabricate a score if the model, video, or measurement evidence is inadequate.

### Running protocols

Keep these as separate protocols:

**Running technique analysis**
- Recommend a stable tripod and side-on camera view.
- Require the full body to remain sufficiently visible during the analyzed section.
- Report only metrics supported by the available video and implemented/validated calculations, for example selected joint-angle patterns or step frequency when events are detected reliably.
- Clearly state recording limitations and do not present an unvalidated aggregate as a certified technique score.

**Sprint timing/speed**
- Define the required distance and reliable start/finish events.
- Specify a capture setup that can actually observe the events.
- Validate timing against an appropriate reference timing method.
- Calculate average speed only when distance and elapsed time are valid and known.
- Return unavailable/retake/review status if evidence is insufficient.
- Never claim that YOLO pose inference alone makes arbitrary smartphone sprint footage accurate.

### Assessment state machine

Persist and centrally validate these states:

`UPLOADED → QUEUED → PROCESSING → VALIDATING → COMPLETED`

Supported alternate terminal/review outcomes:
`NEEDS_RETAKE`, `REVIEW_REQUIRED`, `FAILED`

Upload completion is not assessment completion. Use idempotency, retries, timeouts, and failure recovery so duplicate job delivery cannot create duplicate final results. Invalid footage must not receive fabricated scores.

### Security and privacy

- Hash passwords using Argon2id or bcrypt.
- Enforce role checks and athlete ownership on the backend, not only in the UI.
- Never allow public registration to self-assign `SAI_ADMIN`.
- Keep videos and evidence private; use expiring signed URLs where appropriate.
- Validate file size, MIME/type, actual file content where feasible, duration, and upload ownership. Do not trust file extensions alone.
- Apply request validation, rate limiting, safe error responses, secure headers, and safe logging.
- Store secrets only in environment variables; never commit real secrets.
- Minimize personal data and document consent/retention requirements, particularly for young athletes.
- Preserve audit history and administrative decisions.
- Use a dedicated test database. Never run development migrations against production.

### Quality and delivery rules

- Build a working product, not just static dashboard mockups.
- Production UI data must come from the API/database. Do not use fabricated statistics as if they were real.
- Do not display a result as completed before the backend has completed and validated it.
- Test auth, permissions, ownership, migrations, upload validation, object privacy, queue retries/idempotency, actual inference, metric calculations, invalid-video behavior, compatible rankings, review, and shortlisting.
- Run linting, type checks, automated tests, production builds, migration checks, and at least one end-to-end athlete-to-admin flow where the environment allows.
- Report blockers and unexecuted tests honestly.
- Maintain clear setup instructions, API documentation, architecture notes, model acquisition/licensing notes, and deployment instructions.
- Make responsive, accessible UI with clear loading, empty, error, retake, review-required, and completed states.

## Execution protocol

Begin now:
1. Inspect the repository and report a concise inventory of what already exists.
2. Compare it against the embedded README and PLAN.
3. Identify completed, incomplete, and conflicting work without assuming anything is complete.
4. Implement in the order of the embedded PLAN, prioritizing foundational architecture, PostgreSQL/Prisma, auth, protocols, secure upload/job lifecycle, actual AI inference, result persistence, then athlete/admin interfaces and testing.
5. After each phase, run the relevant checks and update task status only from evidence.
6. Keep the app runnable between phases where practical.
7. At the end, provide setup/run commands, required environment variables, migration/seed instructions, test results, actual AI model status, known limitations, and the exact files changed.

---

# Embedded reference document 1 — README.md

The following is the complete project README content. Use it as the canonical architecture and setup reference. If you create a root `README.md` in the workspace, write this content into it and keep it updated as implementation details become real.

# KhelKhoj

**AI-Powered Multi-Sport Athlete Assessment and Talent Identification Platform**

KhelKhoj is a full-stack platform concept for video-based athletic assessments. Athletes submit videos of prescribed tests, a computer-vision pipeline extracts body keypoints and calculates supported sport-specific metrics, and authorized SAI administrators review evidence, compare eligible results, and manage talent shortlists.

> **Important:** KhelKhoj is an assessment-support platform. AI-generated measurements and scores must not automatically determine athlete selection. Only claim that a test is operational after its protocol, implementation, and validation have been completed.

## 1. Product scope

KhelKhoj has two primary roles:

- **ATHLETE** — manages a profile, chooses a supported sport and test, follows recording instructions, uploads a video, checks processing status, and views available results and history.
- **SAI_ADMIN** — reviews athlete records and assessments, inspects evidence, views compatible sport/test rankings, records decisions, and manages shortlists.

Do not implement Parent Mode or Coach Mode.

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend API | Node.js, Express, TypeScript |
| ORM and migrations | Prisma |
| Primary database | PostgreSQL |
| AI service | Python, FastAPI |
| Primary pose model | Ultralytics YOLO11n-pose (`yolo11n-pose.pt`), subject to compatibility and license verification |
| Video processing | OpenCV |
| Numerical calculations | NumPy |
| Background jobs | Redis + BullMQ |
| Video/evidence storage | S3-compatible object storage in production; local storage for development |
| Charts | Recharts |
| API documentation | OpenAPI |

**PostgreSQL is the sole primary application database. Do not use MongoDB or Mongoose.** Video binaries belong in object storage, not PostgreSQL.

## 3. Architecture at a glance

```text
Next.js Athlete Portal / SAI Admin Dashboard
                    |
                    v
          Express REST API (/api/v1)
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
    PostgreSQL   Redis/BullMQ  Object Storage
    via Prisma   job queue     videos/evidence
                    |
                    v
              Python AI Service
                    |
          OpenCV frame extraction
                    |
             YOLO11n-pose
                    |
       Temporal keypoint tracking
                    |
     Sport-specific rules and metrics
                    |
       Validation and review flags
                    |
                    v
       Results persisted through a
       controlled backend/persistence path
                    |
                    v
       Athlete Results / SAI Analytics
```

The AI service must not expose an unrestricted public inference endpoint. Protect internal service calls and validate all referenced assessments and video objects.

## 4. Core assessment lifecycle

Expected states:

`UPLOADED → QUEUED → PROCESSING → VALIDATING → COMPLETED`

Alternative outcomes:

- `NEEDS_RETAKE`
- `REVIEW_REQUIRED`
- `FAILED`

The application must persist state in PostgreSQL. Upload success does not mean the assessment is complete. Processing must be idempotent and must not create duplicate final results after retries.

## 5. AI and body tracking

The initial model choice is **YOLO11n-pose**. OpenCV handles video decoding, frame extraction, and timestamp access; NumPy supports movement calculations.

YOLO pose inference provides body-keypoint estimates. KhelKhoj must separately implement:

- Subject association across frames.
- Handling for missing or low-confidence keypoints.
- Supported joint-angle calculations.
- Supported temporal event/repetition detection.
- Protocol-specific measurements and scoring.
- Validation, retake, and review conditions.
- Evidence-frame references and timestamps.

Pose confidence is not proof of measurement accuracy. Do not claim accurate real-world distance, height, or speed from uncalibrated pixels.

### Running assessments

Treat these as separate protocols:

1. **Running technique analysis** — initially recommend a stable tripod and a side-on view, with the full body visible throughout the analyzed section. Only report metrics that can be supported by the recording and validated calculations.
2. **Sprint timing/speed** — requires reliable start/finish events and a known distance. Validate timing against a reference timing method. A side-view pose clip alone does not automatically provide valid sprint time or speed.

Do not claim professional-grade sprint timing from arbitrary smartphone footage.

## 6. Database entities

Use Prisma models and PostgreSQL relations for at least:

- `User`
- `AthleteProfile`
- `Sport`
- `TestProtocol`
- `Assessment`
- `AssessmentResult`
- `AdminReview`
- `Shortlist`
- `ShortlistEntry`
- `AuditLog`

Add tables for sessions, password-reset tokens, processing jobs, consent, or retention records when justified. Use UUID identifiers consistently, foreign keys, unique constraints, indexes, and deliberate deletion policies.

Use JSONB for genuinely flexible structures such as protocol configuration and sport-specific metric collections. Keep frequently queried attributes in relational columns. Version test protocols and preserve the exact version used for every assessment.

## 7. Security and privacy

- Hash passwords with Argon2id or bcrypt.
- Enforce roles and record ownership on the backend.
- Do not permit public users to self-assign `SAI_ADMIN`.
- Keep videos and evidence private.
- Use expiring signed URLs where appropriate.
- Validate file size and file type; do not trust filename extensions alone.
- Keep secrets in environment variables.
- Apply rate limits, request validation, safe errors, and secure HTTP headers.
- Minimize personal data and document consent/retention needs, particularly for young athletes.
- Preserve audit history and administrative decisions.
- Never expose tokens, passwords, or unrestricted video URLs.

## 8. Local development

Exact commands depend on the generated project structure. Antigravity must implement and document the actual commands in the final repository. A typical workflow is:

1. Install Node.js and Python versions documented by the project.
2. Start PostgreSQL and Redis, for example using the provided Docker Compose configuration.
3. Copy the relevant `.env.example` files into local environment files and configure values.
4. Install frontend/backend dependencies.
5. Generate the Prisma client.
6. Apply migrations to the development database.
7. Run the seed script and secure administrator bootstrap command.
8. Install Python dependencies and configure model weights.
9. Start the frontend, backend, AI service, and worker.
10. Run automated tests and the real-inference smoke test.

Typical Prisma commands, if supported by the generated project scripts:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

Do not run development migration commands against production. Use the documented production migration workflow.

## 9. Environment variables

Create service-specific `.env.example` files. Use only variables actually required by the implementation. Possible names include:

```dotenv
# Backend / Prisma
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=
BACKEND_PORT=
REDIS_URL=
AI_SERVICE_URL=

# AI service
AI_SERVICE_PORT=
POSE_MODEL_NAME=yolo11n-pose
POSE_MODEL_PATH=
MAX_VIDEO_DURATION_SECONDS=
MAX_FRAME_COUNT=

# Object storage
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_REGION=

# Upload limits
MAX_VIDEO_SIZE_MB=
ALLOWED_VIDEO_FORMATS=
```

The exact `DATABASE_URL` and any direct connection URL must match the chosen Prisma version and deployment setup. Never commit real secrets.

## 10. Testing and acceptance criteria

At minimum, test:

- Authentication and role permissions.
- Athlete ownership checks.
- PostgreSQL migrations and foreign-key integrity.
- Assessment state transitions and duplicate-job handling.
- Upload validation and object access.
- Real YOLO11n-pose inference on a supported sample video.
- Missing-person and low-confidence pose handling.
- Metric/scoring calculations and protocol version selection.
- Result persistence and review workflow.
- Sport/test ranking eligibility.
- Shortlist operations.
- One end-to-end assessment workflow and one invalid-video workflow.

Use a dedicated test database. Do not report a test as passed unless it was run successfully.

## 11. Development data

Seed only clearly labelled development data. Synthetic athletes and synthetic results must never appear as genuine production assessments or enter production rankings. Any mock AI adapter must be development-only, visibly labelled, and disabled in production.

## 12. Definition of done

KhelKhoj is ready for a handoff when:

- Frontend and backend build successfully.
- PostgreSQL connectivity and Prisma migrations work from a fresh database.
- Authentication and role enforcement work.
- Athletes can submit videos through the configured storage flow.
- Jobs can be queued and tracked.
- YOLO11n-pose performs actual inference.
- At least one documented protocol calculates its supported metrics.
- Unreliable videos are flagged rather than assigned fabricated scores.
- Results and evidence references persist correctly.
- Athlete results and SAI review/shortlist workflows work.
- Critical tests have been run and results documented.
- Setup, deployment, limitations, and incomplete features are documented.

## 13. Final handoff

Document:

- Architecture and project structure.
- Database schema and migration process.
- API endpoints.
- Model name/version, dependencies, weights, and licensing notes.
- Implemented protocol details and limitations.
- Environment setup and commands.
- Actual test results.
- Deployment procedure.
- Known issues and incomplete work.


---

# Embedded reference document 2 — PLAN.md

The following is the complete implementation checklist. Use it to sequence work and track verified completion. If you create a root `PLAN.md` in the workspace, write this content into it and update the checkboxes only after verifying each task. Do not delete unfinished tasks merely to make the plan look complete.

# KhelKhoj — Implementation Plan

## Mission

Build a working full-stack multi-sport video-assessment and talent-identification platform. Use PostgreSQL + Prisma as the sole primary application database and YOLO11n-pose as the explicitly selected primary pose-estimation model.

This plan is an implementation checklist, not permission to substitute mocked behavior for real functionality. Update task status only after verifying the work.

## Non-negotiable decisions

- Primary database: PostgreSQL.
- ORM/migrations: Prisma.
- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Backend: Node.js, Express, TypeScript.
- AI service: Python + FastAPI.
- Primary pose model: Ultralytics YOLO11n-pose (`yolo11n-pose.pt`), after compatibility and licensing checks.
- Video processing: OpenCV + NumPy.
- Job queue: Redis + BullMQ.
- Video storage: private object storage in production; local development storage as an adapter.
- Primary roles: `ATHLETE` and `SAI_ADMIN`.
- No Parent Mode or Coach Mode.
- No MongoDB or Mongoose.
- No fabricated production scores, metrics, or dashboard statistics.
- AI scores assist review; they do not independently decide athlete selection.

## Phase 0 — Workspace inspection and technical decisions

- [ ] Inspect the workspace, existing files, installed runtimes, and available services.
- [ ] Identify whether the repository is empty or contains reusable work.
- [ ] Create a concise architecture diagram and directory structure.
- [ ] Choose compatible, pinned dependency versions.
- [ ] Verify YOLO11n-pose availability, supported inference API, model-weight setup, and licensing requirements.
- [ ] Document required environment variables.
- [ ] Identify any unavailable credentials or external services.
- [ ] Create this plan and keep it updated.

**Exit criteria:** A documented plan, known dependency requirements, and a clear implementation sequence. Do not claim the application is implemented yet.

## Phase 1 — Repository and development foundation

- [ ] Initialize frontend and backend projects.
- [ ] Set up TypeScript, linting, formatting, and shared conventions.
- [ ] Create service-specific `.env.example` files.
- [ ] Add Dockerfiles and Docker Compose for practical local services.
- [ ] Configure PostgreSQL and Redis for development.
- [ ] Add health-check endpoints.
- [ ] Establish structured logging and centralized error handling.
- [ ] Add a root README with actual setup instructions.

**Verification**
- [ ] Frontend starts.
- [ ] Backend starts.
- [ ] PostgreSQL and Redis health checks work.
- [ ] No real secrets are committed.

## Phase 2 — PostgreSQL schema and Prisma

- [ ] Configure Prisma for PostgreSQL.
- [ ] Define `User`.
- [ ] Define `AthleteProfile`.
- [ ] Define `Sport`.
- [ ] Define `TestProtocol` with versioned configuration.
- [ ] Define `Assessment`.
- [ ] Define `AssessmentResult`.
- [ ] Define `AdminReview`.
- [ ] Define `Shortlist`.
- [ ] Define `ShortlistEntry`.
- [ ] Define `AuditLog`.
- [ ] Add other tables only where justified, such as sessions, reset tokens, and processing jobs.
- [ ] Add UUID primary keys, foreign keys, unique constraints, indexes, and deliberate deletion behavior.
- [ ] Use JSONB only for variable structured fields.
- [ ] Generate the initial migration.
- [ ] Add seed and administrator-bootstrap commands.
- [ ] Add a database health check.
- [ ] Document development and production migration commands.

**Verification**
- [ ] A fresh development database can be migrated from scratch.
- [ ] Prisma client generation succeeds.
- [ ] Seed data is clearly labelled as development data.
- [ ] Foreign-key and uniqueness constraints behave as expected.
- [ ] No MongoDB or Mongoose dependency exists.

## Phase 3 — Authentication and authorization

- [ ] Implement athlete registration and login.
- [ ] Hash passwords with Argon2id or bcrypt.
- [ ] Implement secure logout and appropriate token/session handling.
- [ ] Implement authentication middleware.
- [ ] Implement `ATHLETE` and `SAI_ADMIN` role enforcement.
- [ ] Implement athlete ownership checks.
- [ ] Add rate limits and request validation.
- [ ] Add secure administrator bootstrap.
- [ ] Prevent public self-assignment of the admin role.
- [ ] Add tests for authentication and access-control boundaries.

**Verification**
- [ ] An athlete cannot access another athlete's profile, video, assessment, or result.
- [ ] Public registration cannot create an administrator.
- [ ] Protected admin routes reject unauthorized users.

## Phase 4 — Sports and protocol catalogue

- [ ] Create sport catalogue APIs.
- [ ] Create protocol listing and detail APIs.
- [ ] Define protocol configuration for recording requirements, metrics, units, scoring, and validation.
- [ ] Version protocols and preserve versions referenced by existing assessments.
- [ ] Add a small, clearly documented set of initial examples.
- [ ] Label each protocol as operational, partial, or catalogue-only.
- [ ] Ensure the frontend only presents supported tests as operational.

**Verification**
- [ ] Protocols load from PostgreSQL.
- [ ] A protocol cannot be used with the wrong sport.
- [ ] Old assessment records retain their original protocol version.

## Phase 5 — Secure video upload and assessment lifecycle

- [ ] Implement assessment creation.
- [ ] Implement secure upload initiation/completion or an equivalent controlled upload flow.
- [ ] Validate size, format, duration where feasible, and storage ownership.
- [ ] Store video files in object storage, not PostgreSQL.
- [ ] Persist file references and metadata.
- [ ] Implement states: `UPLOADED`, `QUEUED`, `PROCESSING`, `VALIDATING`, `COMPLETED`, `NEEDS_RETAKE`, `REVIEW_REQUIRED`, `FAILED`.
- [ ] Define permitted state transitions centrally.
- [ ] Integrate Redis and BullMQ.
- [ ] Add retries, timeouts, idempotency, and failure recovery.
- [ ] Prevent duplicate final results.
- [ ] Add secure status endpoints.

**Verification**
- [ ] Upload success is distinct from assessment completion.
- [ ] Job status survives application restarts.
- [ ] Repeated job delivery does not create duplicate results.
- [ ] Invalid videos are not assigned fabricated scores.

## Phase 6 — Real YOLO11n-pose AI service

- [ ] Create a separate Python/FastAPI service.
- [ ] Pin compatible Python dependencies.
- [ ] Integrate the actual YOLO11n-pose model.
- [ ] Document how weights are acquired and loaded.
- [ ] Load model weights once per worker where practical.
- [ ] Implement OpenCV decoding and frame sampling.
- [ ] Preserve timestamps and frame dimensions.
- [ ] Extract body keypoints and available confidence values.
- [ ] Handle missing-person and multiple-person cases.
- [ ] Handle missing, low-confidence, or occluded landmarks.
- [ ] Implement subject association across frames.
- [ ] Implement structured errors and health checks.
- [ ] Secure internal service calls.
- [ ] Add a real-inference smoke test.

**Verification**
- [ ] A supported sample video produces actual model inference output.
- [ ] Missing model weights produce a clear error rather than a fake result.
- [ ] Keypoints include frame/timestamp context and coordinate conventions.
- [ ] The model is not reloaded for every frame unnecessarily.
- [ ] No unrestricted public inference endpoint exists.

## Phase 7 — Temporal tracking and movement metrics

- [ ] Implement temporal keypoint association.
- [ ] Handle intermittent missed detections.
- [ ] Handle occlusion and uncertain subject identity.
- [ ] Use real timestamps and account for variable frame rates.
- [ ] Implement and unit-test supported joint-angle calculations.
- [ ] Implement supported movement-event/repetition detection where applicable.
- [ ] Preserve raw and derived measurements.
- [ ] Add configurable reliability thresholds.
- [ ] Separate pose confidence from measurement validity.
- [ ] Store evidence-frame references and timestamps where useful.

**Verification**
- [ ] Missing keypoints do not silently become valid measurements.
- [ ] Coordinate systems and units are documented.
- [ ] Uncalibrated pixel distances are not presented as real-world distances.
- [ ] Deterministic metric tests pass on fixed fixtures.

## Phase 8 — Initial running protocols

Implement two distinct protocol categories.

### Running technique

- [ ] Provide side-view recording instructions.
- [ ] Require the full body to remain sufficiently visible.
- [ ] Validate visibility and tracking quality where feasible.
- [ ] Calculate only supported metrics, such as selected joint-angle patterns or step frequency when events can be detected reliably.
- [ ] Document camera and measurement limitations.
- [ ] Avoid presenting an unvalidated aggregate as a certified technique score.

### Sprint timing

- [ ] Define the required distance and start/finish events.
- [ ] Specify a recording setup that can capture those events.
- [ ] Implement event timing only where supported.
- [ ] Compare timing output against a suitable reference method.
- [ ] Mark timing unavailable or request a retake when evidence is insufficient.
- [ ] Do not infer reliable speed from an arbitrary side-view clip.

**Verification**
- [ ] Running technique and sprint timing are separate protocol types.
- [ ] Distance and elapsed time are validated before average speed is calculated.
- [ ] Unvalidated timing is clearly labelled and cannot silently enter a validated leaderboard.

## Phase 9 — Result persistence and assessment APIs

- [ ] Persist raw metrics, derived metrics, scores where available, confidence indicators, validation outcome, model version, protocol version, and evidence references.
- [ ] Use controlled backend/persistence permissions for database writes.
- [ ] Use transactions for result persistence and state transitions.
- [ ] Implement athlete assessment list, detail, status, result, and progress endpoints.
- [ ] Implement pagination and authorization.
- [ ] Add integration tests.

**Verification**
- [ ] Results are linked to the correct athlete, assessment, sport, and protocol.
- [ ] Failed/review-required assessments do not appear as normal completed scores.
- [ ] Results survive restarts.

## Phase 10 — Athlete frontend

- [ ] Build landing page and authentication pages.
- [ ] Build profile setup.
- [ ] Build athlete dashboard using real backend data.
- [ ] Build sport and protocol selection.
- [ ] Build protocol-specific recording instructions.
- [ ] Build upload progress and error handling.
- [ ] Build processing-status display.
- [ ] Build results and evidence views.
- [ ] Build assessment history and compatible progress charts.
- [ ] Add responsive and accessible states.
- [ ] Add frontend tests.

**Verification**
- [ ] New athletes see useful empty states, not fake statistics.
- [ ] The UI never reports a completed result before the backend does.
- [ ] Error and retake states are understandable.

## Phase 11 — SAI/admin dashboard

- [ ] Build real overview analytics from PostgreSQL.
- [ ] Build searchable, filterable, paginated athlete directory.
- [ ] Build athlete profile and assessment inspection.
- [ ] Display relevant video evidence and metrics.
- [ ] Build review queues and review-decision history.
- [ ] Build sport/test-specific leaderboards.
- [ ] Enforce protocol compatibility and ranking eligibility.
- [ ] Build shortlist creation and entry management.
- [ ] Record rationale and administrative actions.
- [ ] Build audit-history views with appropriate permissions.
- [ ] Add admin workflow tests.

**Verification**
- [ ] Admin-only operations are enforced on the backend.
- [ ] Incompatible sports/tests are not ranked together.
- [ ] Administrative decisions do not silently rewrite original AI results.
- [ ] Production analytics are derived from actual database records.

## Phase 12 — Security, integration, and end-to-end testing

- [ ] Test authentication and ownership boundaries.
- [ ] Test PostgreSQL constraints and migrations.
- [ ] Test upload validation and private file access.
- [ ] Test queue retries and idempotency.
- [ ] Test real AI inference.
- [ ] Test metric calculations and invalid footage.
- [ ] Test review and shortlist workflows.
- [ ] Run one complete athlete-to-admin assessment workflow.
- [ ] Run one invalid-video workflow.
- [ ] Review logs for secrets and private data.
- [ ] Run linting, type checks, tests, and production builds.
- [ ] Fix failures and document any remaining issues.

**Verification**
- [ ] Only genuinely executed checks are reported as passed.
- [ ] Test runs use a dedicated test database.
- [ ] No secrets are committed.
- [ ] No mock assessment output can be presented as real in production.

## Phase 13 — Deployment and handoff

- [ ] Complete `.env.example` files.
- [ ] Complete Dockerfiles and local Docker Compose where practical.
- [ ] Document PostgreSQL setup, migrations, seeds, and admin bootstrap.
- [ ] Document Redis and object storage.
- [ ] Document model-weight setup and Python service startup.
- [ ] Document frontend/backend/worker commands.
- [ ] Document production deployment and migrations.
- [ ] Document backups, retention, and operational monitoring.
- [ ] Record actual test outcomes.
- [ ] List implemented protocols and their limitations.
- [ ] List incomplete features and known risks.
- [ ] Update `README.md` to match the actual repository.

**Final exit criteria:** The app has a real end-to-end assessment workflow, PostgreSQL-backed persistence, actual YOLO11n-pose inference, tested protocol-specific calculations, athlete results, and an SAI review/shortlisting workflow. Any remaining limitations are explicit.

## Working rules for the agent

1. Inspect before editing.
2. Work in small, coherent phases.
3. Keep this plan updated as tasks are completed.
4. Do not mark tasks complete based on generated code alone; verify them.
5. Do not use MongoDB or Mongoose.
6. Do not silently replace YOLO11n-pose.
7. Do not fabricate scores, measurements, test results, or deployment success.
8. Do not use mock AI in production.
9. Prefer a working vertical slice over many unfinished pages.
10. At handoff, state exactly what works, what was tested, and what remains incomplete.
