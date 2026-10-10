# KhelKhoj

**AI-Powered Multi-Sport Athlete Assessment and Talent Identification Platform**

KhelKhoj is an enterprise full-stack platform for computer-vision athletic assessments developed for the Sports Authority of India (SAI) and Khelo India. Athletes submit video recordings of standardized tests, a computer-vision pipeline powered by **Ultralytics YOLO11n-Pose**, **OpenCV**, and **NumPy** extracts 17 body keypoints, calculates joint angles and movement metrics, and authorized SAI administrators review evidence, compare eligible protocol rankings, and manage talent shortlists.

> **Important:** KhelKhoj is an assessment-support platform. AI-generated measurements and scores do not independently decide athlete selection; they provide validated biomechanical evidence for SAI coaches and scouting committees.

---

## 1. Verified Live System Status

All 4 tiers of the platform are fully built, integrated, and actively running:

| Component | Technology | Local Port / URL | Status |
|---|---|---|---|
| **Frontend Portal** | Next.js 14, React, TypeScript, Tailwind CSS | `http://localhost:3000` | **ONLINE** |
| **Backend REST API** | Node.js, Express, TypeScript, Zod, JWT | `http://localhost:5000` | **ONLINE** (`/health` UP) |
| **AI Computer Vision** | Python 3.12, FastAPI, YOLO11n-Pose, OpenCV, NumPy | `http://localhost:8000` | **ONLINE** (`/health` HEALTHY) |
| **Primary Database** | Native PostgreSQL 18 via Prisma ORM | `localhost:5433` (`khelkhoj`) | **CONNECTED** (0 Mongoose/Mongo) |

---

## 2. Quick Demo Access Credentials

The database is pre-seeded with official SAI admin credentials and representative athlete accounts:

### SAI Admin Account
- **URL**: `http://localhost:3000/admin`
- **Email**: `admin@sai.gov.in`
- **Password**: `SaiAdmin@2026`
- **Capabilities**: National analytics overview, video evidence playback, administrative review decisions (`APPROVED`, `REJECTED`, `RETAKE_REQUESTED`, `FLAGGED`), protocol-compatible leaderboards, talent shortlist creation, and immutable audit logs.

### Athlete Account
- **URL**: `http://localhost:3000/athlete`
- **Email**: `rahul.verma@example.com`
- **Password**: `Athlete@2026`
- **Capabilities**: Athlete profile management, protocol camera & recording instructions drawer, video submission with real-time lifecycle tracking, sub-degree joint angle inspection, and keypoint evidence snapshot gallery.

*(One-click demo login buttons are also provided on both the landing page and login screen.)*

---

## 3. Architecture & Directory Structure

```text
d:/DOOM/
├── apps/
│   ├── frontend/               # Next.js 14 Web Application
│   │   ├── src/app/            # App Router: /, /login, /athlete, /admin
│   │   ├── src/components/     # Navbar, charts, modals
│   │   ├── src/context/        # AuthContext (JWT session management)
│   │   └── src/lib/            # API client helper
│   ├── backend/                # Node.js Express REST API (/api/v1)
│   │   ├── prisma/             # schema.prisma & seed.ts
│   │   ├── scripts/            # run-pg.ts (PostgreSQL daemon)
│   │   └── src/                # auth, sports, protocols, assessments, admin
│   └── ai-service/             # Python FastAPI Service
│       ├── venv/               # Dedicated Python virtual environment
│       ├── yolo11n-pose.pt     # Ultralytics YOLO11n-Pose weights
│       ├── service.py          # Frame decoding, pose tracking, angle calculations
│       └── generate_sample_video.py # Synthetic video validation generator
├── storage/                    # Storage Adapter
│   ├── videos/                 # Uploaded athlete MP4/MOV videos
│   └── evidence/               # Annotated YOLO pose keypoint frames
├── start-all.ps1               # Automated launch script
├── PLAN.md                     # Phase-by-phase implementation verification log
└── README.md                   # Canonical documentation
```

---

## 4. AI Biomechanics & Computer Vision Implementation

### Model
- **Ultralytics YOLO11n-Pose** (`yolo11n-pose.pt`) loaded once in memory at startup.
- Keypoints: 17 standard COCO landmarks with coordinates and per-keypoint confidence.

### Movement Calculations
- **Interior 2D Angle**: Vector dot product with arccos clipping:
  $$\theta = \arccos\left(\frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}\right)$$
- **Knee Flexion Swing**: $\angle(\text{Hip}, \text{Knee}, \text{Ankle})$
- **Hip Extension**: $\angle(\text{Shoulder}, \text{Hip}, \text{Knee})$
- **Torso Lean**: Sagittal inclination angle relative to vertical.
- **Cadence Estimation**: Sinusoidal ankle oscillation frequency over time.

### Rigorous Quality Gate & Retake Detection
- Rejects uncalibrated pixel distances as certified speeds.
- If keypoint visibility ratio drops below 40% or average confidence is $<0.40$, the system returns `needsRetake: true` and `overallScore: null`, preventing fabricated scores.

---

## 5. Supported Protocols Catalogue

1. **Running Gait & Technique Analysis** (`RUN-TECH-01`, Version 1)
   - **Sport**: Athletics & Track
   - **Setup**: Side-on (sagittal plane) tripod, waist height, 30+ FPS, 6-8m distance.
   - **Metrics**: Knee Flexion Swing (°), Hip Extension (°), Torso Lean (°), Cadence (spm).
2. **30m Sprint Acceleration & Velocity** (`SPRINT-30M-01`, Version 1)
   - **Sport**: Athletics & Track
   - **Setup**: Elevated 45-degree angle capturing start and 30m marker cones.
   - **Metrics**: 30m Elapsed Time (s), Average Speed (km/h), Peak Velocity (m/s).

---

## 6. How to Start the Services

To launch all 4 services together:

```powershell
# From project root:
.\start-all.ps1
```

Or run services individually:

```powershell
# Terminal 1: Embedded PostgreSQL
cd d:\DOOM\apps\backend
npx.cmd tsx scripts/run-pg.ts

# Terminal 2: AI Service
cd d:\DOOM\apps\ai-service
.\venv\Scripts\python.exe service.py

# Terminal 3: Express Backend
cd d:\DOOM\apps\backend
npx.cmd tsx src/index.ts

# Terminal 4: Next.js Frontend
cd d:\DOOM\apps\frontend
npm.cmd run dev
```
