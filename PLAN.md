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
- Primary pose model: Ultralytics YOLO11n-pose (`yolo11n-pose.pt`), verified and loaded.
- Video processing: OpenCV + NumPy.
- Background jobs: Redis + BullMQ / reliable transactional execution.
- Video storage: private object storage / local development storage adapter.
- Primary roles: `ATHLETE` and `SAI_ADMIN`.
- No Parent Mode or Coach Mode.
- No MongoDB or Mongoose.
- No fabricated production scores, metrics, or dashboard statistics.
- AI scores assist review; they do not independently decide athlete selection.

## Phase 0 — Workspace inspection and technical decisions

- [x] Inspect the workspace, existing files, installed runtimes, and available services.
- [x] Identify whether the repository is empty or contains reusable work.
- [x] Create a concise architecture diagram and directory structure.
- [x] Choose compatible, pinned dependency versions.
- [x] Verify YOLO11n-pose availability, supported inference API, model-weight setup, and licensing requirements.
- [x] Document required environment variables.
- [x] Identify any unavailable credentials or external services.
- [x] Create this plan and keep it updated.

## Phase 1 — Repository and development foundation

- [x] Initialize frontend and backend projects.
- [x] Set up TypeScript, linting, formatting, and shared conventions.
- [x] Create service-specific `.env.example` files.
- [x] Configure PostgreSQL and Redis for development.
- [x] Add health-check endpoints.
- [x] Establish structured logging and centralized error handling.
- [x] Add a root README with actual setup instructions.

## Phase 2 — PostgreSQL schema and Prisma

- [x] Configure Prisma for PostgreSQL.
- [x] Define `User`.
- [x] Define `AthleteProfile`.
- [x] Define `Sport`.
- [x] Define `TestProtocol` with versioned configuration.
- [x] Define `Assessment`.
- [x] Define `AssessmentResult`.
- [x] Define `AdminReview`.
- [x] Define `Shortlist`.
- [x] Define `ShortlistEntry`.
- [x] Define `AuditLog`.
- [x] Add UUID primary keys, foreign keys, unique constraints, indexes, and deliberate deletion behavior.
- [x] Use JSONB only for variable structured fields.
- [x] Generate the initial migration.
- [x] Add seed and administrator-bootstrap commands.
- [x] Add a database health check.
- [x] Document development and production migration commands.

## Phase 3 — Authentication and authorization

- [x] Implement athlete registration and login.
- [x] Hash passwords with bcrypt.
- [x] Implement secure logout and appropriate token/session handling.
- [x] Implement authentication middleware.
- [x] Implement `ATHLETE` and `SAI_ADMIN` role enforcement.
- [x] Implement athlete ownership checks.
- [x] Add rate limits and request validation.
- [x] Add secure administrator bootstrap.
- [x] Prevent public self-assignment of the admin role.
- [x] Add tests for authentication and access-control boundaries.

## Phase 4 — Sports and protocol catalogue

- [x] Create sport catalogue APIs.
- [x] Create protocol listing and detail APIs.
- [x] Define protocol configuration for recording requirements, metrics, units, scoring, and validation.
- [x] Version protocols and preserve versions referenced by existing assessments.
- [x] Add a small, clearly documented set of initial examples.
- [x] Label each protocol as operational, partial, or catalogue-only.
- [x] Ensure the frontend only presents supported tests as operational.

## Phase 5 — Secure video upload and assessment lifecycle

- [x] Implement assessment creation.
- [x] Implement secure upload initiation/completion flow.
- [x] Validate size, format, duration where feasible, and storage ownership.
- [x] Store video files in storage adapter, not PostgreSQL.
- [x] Persist file references and metadata.
- [x] Implement states: `UPLOADED`, `QUEUED`, `PROCESSING`, `VALIDATING`, `COMPLETED`, `NEEDS_RETAKE`, `REVIEW_REQUIRED`, `FAILED`.
- [x] Define permitted state transitions centrally.
- [x] Add retries, timeouts, idempotency, and failure recovery.
- [x] Prevent duplicate final results.
- [x] Add secure status endpoints.

## Phase 6 — Real YOLO11n-pose AI service

- [x] Create a separate Python/FastAPI service.
- [x] Pin compatible Python dependencies (ultralytics, opencv-python, numpy, fastapi, uvicorn).
- [x] Integrate the actual YOLO11n-pose model (`yolo11n-pose.pt`).
- [x] Document how weights are acquired and loaded.
- [x] Load model weights once per worker.
- [x] Implement OpenCV decoding and frame sampling.
- [x] Preserve timestamps and frame dimensions.
- [x] Extract body keypoints and available confidence values.
- [x] Handle missing-person and multiple-person cases.
- [x] Handle missing, low-confidence, or occluded landmarks.
- [x] Implement subject association across frames.
- [x] Implement structured errors and health checks.
- [x] Secure internal service calls.
- [x] Add a real-inference smoke test.

## Phase 7 — Temporal tracking and movement metrics

- [x] Implement temporal keypoint association.
- [x] Handle intermittent missed detections.
- [x] Handle occlusion and uncertain subject identity.
- [x] Use real timestamps and account for variable frame rates.
- [x] Implement and unit-test supported joint-angle calculations (knee flexion, hip extension, torso lean).
- [x] Implement supported movement-event/repetition detection where applicable.
- [x] Preserve raw and derived measurements.
- [x] Add configurable reliability thresholds.
- [x] Separate pose confidence from measurement validity.
- [x] Store evidence-frame references and timestamps.

## Phase 8 — Initial running protocols

- [x] Running technique: side-view sagittal recording instructions, full body tracking, knee flexion swing, hip extension, cadence frequency.
- [x] Sprint timing: 30m sprint protocol with distance, elapsed time, peak velocity, average speed.

## Phase 9 — Result persistence and assessment APIs

- [x] Persist raw metrics, derived metrics, scores, confidence indicators, validation outcome, model version, protocol version, and evidence references.
- [x] Use controlled backend/persistence permissions for database writes.
- [x] Use transactions for result persistence and state transitions.
- [x] Implement athlete assessment list, detail, status, result, and progress endpoints.
- [x] Implement pagination and authorization.

## Phase 10 — Athlete frontend

- [x] Build landing page and authentication pages.
- [x] Build profile setup.
- [x] Build athlete dashboard using real backend data.
- [x] Build sport and protocol selection.
- [x] Build protocol-specific recording instructions.
- [x] Build upload progress and error handling.
- [x] Build processing-status display.
- [x] Build results and evidence views.
- [x] Build assessment history and compatible progress charts.
- [x] Add responsive and accessible states.

## Phase 11 — SAI/admin dashboard

- [x] Build real overview analytics from PostgreSQL.
- [x] Build searchable, filterable, paginated athlete directory.
- [x] Build athlete profile and assessment inspection.
- [x] Display relevant video evidence and metrics.
- [x] Build review queues and review-decision history.
- [x] Build sport/test-specific leaderboards.
- [x] Enforce protocol compatibility and ranking eligibility.
- [x] Build shortlist creation and entry management.
- [x] Record rationale and administrative actions.
- [x] Build audit-history views with appropriate permissions.

## Phase 12 — Security, integration, and end-to-end testing

- [x] Test authentication and ownership boundaries.
- [x] Test PostgreSQL constraints and migrations.
- [x] Test upload validation and private file access.
- [x] Test real AI inference.
- [x] Test metric calculations and invalid footage.
- [x] Test review and shortlist workflows.
- [x] Run complete athlete-to-admin assessment workflow.
- [x] Run invalid-video workflow.

## Phase 13 — Deployment and handoff

- [x] Complete `.env.example` files.
- [x] Document PostgreSQL setup, migrations, seeds, and admin bootstrap.
- [x] Document model-weight setup and Python service startup.
- [x] Document frontend/backend/worker commands.
- [x] List implemented protocols and their limitations.
- [x] Finalize `README.md` and startup scripts.
