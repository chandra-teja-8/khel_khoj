import { PrismaClient, Role, AssessmentStatus, ProtocolStatus, ReviewDecision } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seed with all 5 required tests...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.shortlistEntry.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.adminReview.deleteMany();
  await prisma.assessmentResult.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.testProtocol.deleteMany();
  await prisma.athleteProfile.deleteMany();
  await prisma.sport.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('SaiAdmin@2026', salt);
  const athletePassword = await bcrypt.hash('Athlete@2026', salt);

  // 1. Create SAI Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sai.gov.in',
      passwordHash: adminPassword,
      role: Role.SAI_ADMIN
    }
  });
  console.log('[Seed] SAI Admin created:', admin.email);

  // 2. Create Sports
  const athletics = await prisma.sport.create({
    data: {
      code: 'ATHLETICS',
      name: 'Athletics & Track',
      category: 'Track & Field',
      description: 'Running, sprinting, jumps, and fundamental athletic movement patterns.',
      icon: 'zap',
      isOperational: true
    }
  });

  const generalFitness = await prisma.sport.create({
    data: {
      code: 'FITNESS',
      name: 'General Physical Fitness',
      category: 'Foundation & Conditioning',
      description: 'Foundational endurance, core stability, and upper body strength benchmarks.',
      icon: 'activity',
      isOperational: true
    }
  });

  const football = await prisma.sport.create({
    data: {
      code: 'FOOTBALL',
      name: 'Football (Soccer)',
      category: 'Team Sport',
      description: 'Cardiovascular endurance, agility, and sprint mechanics for outfield play.',
      icon: 'activity',
      isOperational: true
    }
  });

  console.log('[Seed] Sports created: Athletics, Fitness, Football');

  // 3. Create the 5 Required Protocols
  // Protocol 1: Pushups
  const pushupsProtocol = await prisma.testProtocol.create({
    data: {
      sportId: generalFitness.id,
      code: 'PUSHUPS-01',
      name: 'Pushups Assessment',
      description: 'Standard pushup test measuring chest-to-ground depth, elbow flexion angle (minimum 90°), repetition count, and plank torso alignment without hip sagging.',
      version: 1,
      status: ProtocolStatus.OPERATIONAL,
      recordingGuidelines: {
        cameraPosition: '45-degree front/side angle with tripod at 0.6m height',
        distanceMeters: '3 to 4 meters from athlete',
        heightMeters: '0.6 meters on stable tripod',
        captureZoneMeters: 'Full body visible from head to toes throughout entire movement',
        frameRateFps: 30,
        lighting: 'Well-lit flat floor or exercise mat',
        attire: 'Contrasting athletic t-shirt and shorts'
      },
      metricDefinitions: {
        repetitionCount: { unit: 'reps', optimalRange: [25, 45], weight: 0.4 },
        avgElbowFlexionDeg: { unit: 'degrees', optimalRange: [80, 95], weight: 0.3 },
        torsoAlignmentStability: { unit: '%', optimalRange: [85, 100], weight: 0.2 },
        cadenceRpm: { unit: 'reps/min', optimalRange: [24, 38], weight: 0.1 }
      },
      scoringConfig: {
        scale: '0-100',
        passingScore: 60,
        eliteThreshold: 85
      },
      validationRules: {
        minElbowFlexionThresholdDeg: 90,
        hipSagToleranceDeg: 15,
        fullLockoutRequired: true,
        singleSubjectRequired: true
      }
    }
  });

  // Protocol 2: 100 Metres Sprint / Run
  const sprint100mProtocol = await prisma.testProtocol.create({
    data: {
      sportId: athletics.id,
      code: 'SPRINT-100M-01',
      name: '100 Metres Sprint / Run',
      description: 'Official 100-meter straight track sprint test measuring explosive start reaction, 0-30m acceleration phase, top speed maintenance, stride cadence, and 100m elapsed time.',
      version: 1,
      status: ProtocolStatus.OPERATIONAL,
      recordingGuidelines: {
        cameraPosition: 'Side elevated view or finish line gate covering 100m track lane',
        distanceMeters: '15 to 20 meters from track',
        heightMeters: '1.5 meters on stable tripod',
        captureZoneMeters: 'Start line to 100m finish threshold marker',
        frameRateFps: 30,
        lighting: 'Daylight or illuminated athletic track',
        attire: 'Running spikes/shoes with contrasting race singlet'
      },
      metricDefinitions: {
        elapsedTimeSeconds: { unit: 'seconds', optimalRange: [10.8, 12.5], weight: 0.45 },
        peakVelocityMps: { unit: 'm/s', optimalRange: [8.5, 11.2], weight: 0.25 },
        averageSpeedKmph: { unit: 'km/h', optimalRange: [28.0, 36.0], weight: 0.2 },
        strideCadenceSpm: { unit: 'steps/min', optimalRange: [220, 260], weight: 0.1 }
      },
      scoringConfig: {
        scale: '0-100',
        passingScore: 65,
        eliteThreshold: 90
      },
      validationRules: {
        stationaryStartTrigger: true,
        finishLineCrossed: true,
        calibratedDistanceMeters: 100
      }
    }
  });

  // Protocol 3: Situps
  const situpsProtocol = await prisma.testProtocol.create({
    data: {
      sportId: generalFitness.id,
      code: 'SITUPS-01',
      name: 'Situps Assessment',
      description: 'Dynamic situp test tracking trunk flexion angle, full shoulder blade ground contact on eccentric phase, elbow-to-knee contact on concentric phase, and repetition pace.',
      version: 1,
      status: ProtocolStatus.OPERATIONAL,
      recordingGuidelines: {
        cameraPosition: 'Side profile (sagittal plane), exactly perpendicular to exercise mat',
        distanceMeters: '2.5 to 3.5 meters',
        heightMeters: '0.8 meters (waist level)',
        captureZoneMeters: 'Entire mat, torso, and feet visible',
        frameRateFps: 30,
        lighting: 'Even indoor illumination',
        attire: 'Gym attire with contrasting colors'
      },
      metricDefinitions: {
        repetitionCount: { unit: 'reps', optimalRange: [35, 55], weight: 0.45 },
        trunkFlexionAngleDeg: { unit: 'degrees', optimalRange: [45, 65], weight: 0.3 },
        repCadenceRpm: { unit: 'reps/min', optimalRange: [30, 48], weight: 0.25 }
      },
      scoringConfig: {
        scale: '0-100',
        passingScore: 60,
        eliteThreshold: 85
      },
      validationRules: {
        scapulaContactRequired: true,
        kneesBent90Deg: true,
        singleSubjectRequired: true
      }
    }
  });

  // Protocol 4: Wall Sit
  const wallsitProtocol = await prisma.testProtocol.create({
    data: {
      sportId: generalFitness.id,
      code: 'WALLSIT-01',
      name: 'Wall Sit Isometric Hold',
      description: 'Isometric wall sit hold measuring continuous hold duration with thighs parallel to floor (90° knee angle) and back flat against the wall.',
      version: 1,
      status: ProtocolStatus.OPERATIONAL,
      recordingGuidelines: {
        cameraPosition: 'Strict side view perpendicular to wall and leg orientation',
        distanceMeters: '3 meters from athlete',
        heightMeters: '0.9 meters (knee height)',
        captureZoneMeters: 'Wall contact, back, thighs, and feet visible',
        frameRateFps: 30,
        lighting: 'Clear vertical wall with solid contrast',
        attire: 'Athletic shorts showing clear knee angle definition'
      },
      metricDefinitions: {
        holdDurationSeconds: { unit: 'seconds', optimalRange: [60, 120], weight: 0.5 },
        kneeFlexionAngleDeg: { unit: 'degrees', optimalRange: [88, 95], weight: 0.3 },
        angleStabilityVariance: { unit: 'deg', optimalRange: [0, 4], weight: 0.2 }
      },
      scoringConfig: {
        scale: '0-100',
        passingScore: 60,
        eliteThreshold: 85
      },
      validationRules: {
        wallContactContinuous: true,
        kneeAngleToleranceDeg: 10,
        noHandSupportOnThighs: true
      }
    }
  });

  // Protocol 5: High Jumps
  const highjumpProtocol = await prisma.testProtocol.create({
    data: {
      sportId: athletics.id,
      code: 'HIGHJUMP-01',
      name: 'High Jumps / Vertical Clearance',
      description: 'Vertical/high jump clearance assessment measuring countermovement dip angle, takeoff velocity, airborne flight time, and peak clearance height.',
      version: 1,
      status: ProtocolStatus.OPERATIONAL,
      recordingGuidelines: {
        cameraPosition: 'Frontal or 45-degree angle capturing full body and vertical jump marker',
        distanceMeters: '4 to 5 meters back',
        heightMeters: '1.2 meters on stable tripod',
        captureZoneMeters: 'Full standing posture through highest jump apex',
        frameRateFps: 30,
        lighting: 'Bright athletic field or indoor jumping pit',
        attire: 'Athletic wear and jumping footwear'
      },
      metricDefinitions: {
        jumpHeightCm: { unit: 'cm', optimalRange: [50, 75], weight: 0.45 },
        flightTimeMs: { unit: 'ms', optimalRange: [520, 680], weight: 0.3 },
        takeoffVelocityMps: { unit: 'm/s', optimalRange: [2.8, 3.8], weight: 0.25 }
      },
      scoringConfig: {
        scale: '0-100',
        passingScore: 60,
        eliteThreshold: 88
      },
      validationRules: {
        stationaryTakeoff: true,
        bothFeetTakeoff: true,
        clearLandingRecorded: true
      }
    }
  });

  console.log('[Seed] 5 Test protocols created: Pushups, 100m Sprint, Situps, Wall Sit, High Jumps');

  // 4. Create Athletes
  const athlete1User = await prisma.user.create({
    data: {
      email: 'rahul.verma@example.com',
      passwordHash: athletePassword,
      role: Role.ATHLETE
    }
  });
  const athlete1Profile = await prisma.athleteProfile.create({
    data: {
      userId: athlete1User.id,
      fullName: 'Rahul Verma',
      dateOfBirth: new Date('2006-04-12'),
      gender: 'Male',
      state: 'Haryana',
      district: 'Rohtak',
      primarySportId: athletics.id,
      heightCm: 178,
      weightKg: 68,
      emergencyContact: '+91 98765 43210'
    }
  });

  const athlete2User = await prisma.user.create({
    data: {
      email: 'priya.sharma@example.com',
      passwordHash: athletePassword,
      role: Role.ATHLETE
    }
  });
  const athlete2Profile = await prisma.athleteProfile.create({
    data: {
      userId: athlete2User.id,
      fullName: 'Priya Sharma',
      dateOfBirth: new Date('2007-08-23'),
      gender: 'Female',
      state: 'Punjab',
      district: 'Patiala',
      primarySportId: athletics.id,
      heightCm: 166,
      weightKg: 55,
      emergencyContact: '+91 98123 45678'
    }
  });

  const athlete3User = await prisma.user.create({
    data: {
      email: 'arjun.nair@example.com',
      passwordHash: athletePassword,
      role: Role.ATHLETE
    }
  });
  const athlete3Profile = await prisma.athleteProfile.create({
    data: {
      userId: athlete3User.id,
      fullName: 'Arjun Nair',
      dateOfBirth: new Date('2005-11-05'),
      gender: 'Male',
      state: 'Kerala',
      district: 'Ernakulam',
      primarySportId: generalFitness.id,
      heightCm: 182,
      weightKg: 72,
      emergencyContact: '+91 94455 66778'
    }
  });

  console.log('[Seed] Athletes created: Rahul Verma, Priya Sharma, Arjun Nair');

  // 5. Create Sample Assessments covering the 5 Tests
  // Assessment 1: Rahul Verma - Pushups
  const assessment1 = await prisma.assessment.create({
    data: {
      athleteId: athlete1Profile.id,
      sportId: generalFitness.id,
      protocolId: pushupsProtocol.id,
      protocolVersion: 1,
      status: AssessmentStatus.COMPLETED,
      videoPath: 'storage/videos/sample_pushups_rahul.mp4',
      videoOriginalName: 'rahul_pushups_standard.mp4',
      videoMimeType: 'video/mp4',
      videoSize: 14200100,
      durationSeconds: 45.0,
      result: {
        create: {
          overallScore: 89.2,
          confidenceScore: 0.95,
          validationPassed: true,
          modelName: 'yolo11n-pose',
          modelVersion: '11n-1.0',
          rawMetrics: {
            analyzedFrames: 220,
            keypointsTrackedPercentage: 97.4,
            averageJointConfidence: 0.94
          },
          derivedMetrics: {
            repetitionCount: 38,
            avgElbowFlexionDeg: 88.4,
            torsoAlignmentStability: 94.2,
            cadenceRpm: 32.5
          },
          evidenceFrames: [
            { timestampSec: 8.2, label: 'Optimal 90° Elbow Depth', keypointsDetected: 17, confidence: 0.96 },
            { timestampSec: 22.4, label: 'Plank Alignment Integrity', keypointsDetected: 17, confidence: 0.94 }
          ],
          validationFlags: {
            multiPersonDetected: false,
            occlusionRate: 0.026,
            sufficientLighting: true,
            cameraStable: true
          }
        }
      }
    }
  });

  await prisma.adminReview.create({
    data: {
      assessmentId: assessment1.id,
      reviewerId: admin.id,
      decision: ReviewDecision.APPROVED,
      reviewNotes: 'Excellent pushup depth consistency and zero hip sag throughout 38 repetitions. Recommended for National Sprint Camp Trials Stage 1.'
    }
  });

  // Assessment 2: Priya Sharma - 100 Metres Sprint / Run
  const assessment2 = await prisma.assessment.create({
    data: {
      athleteId: athlete2Profile.id,
      sportId: athletics.id,
      protocolId: sprint100mProtocol.id,
      protocolVersion: 1,
      status: AssessmentStatus.COMPLETED,
      videoPath: 'storage/videos/sample_100m_priya.mp4',
      videoOriginalName: 'priya_100m_sprint_finals.mp4',
      videoMimeType: 'video/mp4',
      videoSize: 26400300,
      durationSeconds: 12.0,
      result: {
        create: {
          overallScore: 93.4,
          confidenceScore: 0.96,
          validationPassed: true,
          modelName: 'yolo11n-pose',
          modelVersion: '11n-1.0',
          rawMetrics: {
            analyzedFrames: 360,
            keypointsTrackedPercentage: 98.2,
            averageJointConfidence: 0.95
          },
          derivedMetrics: {
            elapsedTimeSeconds: 11.82,
            peakVelocityMps: 9.85,
            averageSpeedKmph: 30.46,
            strideCadenceSpm: 242
          },
          evidenceFrames: [
            { timestampSec: 2.1, label: 'Explosive 30m Acceleration Gate', keypointsDetected: 17, confidence: 0.97 },
            { timestampSec: 11.82, label: '100m Finish Line Chest Crossing', keypointsDetected: 17, confidence: 0.95 }
          ],
          validationFlags: {
            multiPersonDetected: false,
            occlusionRate: 0.018,
            sufficientLighting: true,
            cameraStable: true
          }
        }
      }
    }
  });

  await prisma.adminReview.create({
    data: {
      assessmentId: assessment2.id,
      reviewerId: admin.id,
      decision: ReviewDecision.APPROVED,
      reviewNotes: 'Exceptional 100m time (11.82s) for under-18 category. High velocity maintenance and smooth stride mechanics.'
    }
  });

  // Assessment 3: Arjun Nair - Situps
  const assessment3 = await prisma.assessment.create({
    data: {
      athleteId: athlete3Profile.id,
      sportId: generalFitness.id,
      protocolId: situpsProtocol.id,
      protocolVersion: 1,
      status: AssessmentStatus.COMPLETED,
      videoPath: 'storage/videos/sample_situps_arjun.mp4',
      videoOriginalName: 'arjun_situps_assessment.mp4',
      videoMimeType: 'video/mp4',
      videoSize: 18100200,
      durationSeconds: 60.0,
      result: {
        create: {
          overallScore: 86.0,
          confidenceScore: 0.92,
          validationPassed: true,
          modelName: 'yolo11n-pose',
          modelVersion: '11n-1.0',
          rawMetrics: {
            analyzedFrames: 300,
            keypointsTrackedPercentage: 95.0,
            averageJointConfidence: 0.91
          },
          derivedMetrics: {
            repetitionCount: 46,
            trunkFlexionAngleDeg: 52.1,
            repCadenceRpm: 38.0
          },
          evidenceFrames: [
            { timestampSec: 14.5, label: 'Complete Scapula Ground Return', keypointsDetected: 17, confidence: 0.93 },
            { timestampSec: 36.2, label: 'Peak Trunk Flexion Angle', keypointsDetected: 17, confidence: 0.91 }
          ],
          validationFlags: {
            multiPersonDetected: false,
            occlusionRate: 0.05,
            sufficientLighting: true,
            cameraStable: true
          }
        }
      }
    }
  });

  // Assessment 4: Rahul Verma - Wall Sit
  const assessment4 = await prisma.assessment.create({
    data: {
      athleteId: athlete1Profile.id,
      sportId: generalFitness.id,
      protocolId: wallsitProtocol.id,
      protocolVersion: 1,
      status: AssessmentStatus.COMPLETED,
      videoPath: 'storage/videos/sample_wallsit_rahul.mp4',
      videoOriginalName: 'rahul_wallsit_endurance.mp4',
      videoMimeType: 'video/mp4',
      videoSize: 22400500,
      durationSeconds: 85.0,
      result: {
        create: {
          overallScore: 91.5,
          confidenceScore: 0.96,
          validationPassed: true,
          modelName: 'yolo11n-pose',
          modelVersion: '11n-1.0',
          rawMetrics: {
            analyzedFrames: 280,
            keypointsTrackedPercentage: 98.6,
            averageJointConfidence: 0.96
          },
          derivedMetrics: {
            holdDurationSeconds: 84.0,
            kneeFlexionAngleDeg: 90.4,
            angleStabilityVariance: 1.8
          },
          evidenceFrames: [
            { timestampSec: 30.0, label: 'Parallel Thigh 90° Knee Angle', keypointsDetected: 17, confidence: 0.97 },
            { timestampSec: 75.0, label: 'Maintained Isometric Stability', keypointsDetected: 17, confidence: 0.95 }
          ],
          validationFlags: {
            multiPersonDetected: false,
            occlusionRate: 0.014,
            sufficientLighting: true,
            cameraStable: true
          }
        }
      }
    }
  });

  // Assessment 5: Rahul Verma - High Jumps
  const assessment5 = await prisma.assessment.create({
    data: {
      athleteId: athlete1Profile.id,
      sportId: athletics.id,
      protocolId: highjumpProtocol.id,
      protocolVersion: 1,
      status: AssessmentStatus.COMPLETED,
      videoPath: 'storage/videos/sample_highjump_rahul.mp4',
      videoOriginalName: 'rahul_highjump_vertical.mp4',
      videoMimeType: 'video/mp4',
      videoSize: 12500000,
      durationSeconds: 5.5,
      result: {
        create: {
          overallScore: 87.8,
          confidenceScore: 0.94,
          validationPassed: true,
          modelName: 'yolo11n-pose',
          modelVersion: '11n-1.0',
          rawMetrics: {
            analyzedFrames: 165,
            keypointsTrackedPercentage: 96.0,
            averageJointConfidence: 0.93
          },
          derivedMetrics: {
            jumpHeightCm: 64.2,
            flightTimeMs: 615,
            takeoffVelocityMps: 3.24
          },
          evidenceFrames: [
            { timestampSec: 1.8, label: 'Countermovement Dip Angle', keypointsDetected: 17, confidence: 0.94 },
            { timestampSec: 2.7, label: 'Peak Vertical Jump Apex', keypointsDetected: 17, confidence: 0.96 }
          ],
          validationFlags: {
            multiPersonDetected: false,
            occlusionRate: 0.04,
            sufficientLighting: true,
            cameraStable: true
          }
        }
      }
    }
  });

  // 6. Create SAI Shortlist
  const shortlist = await prisma.shortlist.create({
    data: {
      creatorId: admin.id,
      name: 'Khelo India 2026 — Under-20 Sprint & Conditioning Probables',
      description: 'Athletes meeting Stage 1 benchmarks across Pushups, 100m Sprint, Situps, Wall Sit, and High Jumps.',
      sportId: athletics.id,
      entries: {
        create: [
          {
            athleteId: athlete1Profile.id,
            assessmentId: assessment1.id,
            notes: 'High muscular endurance (38 pushups) and 84s wall sit stability.'
          },
          {
            athleteId: athlete2Profile.id,
            assessmentId: assessment2.id,
            notes: 'National benchmark 100m sprint performance (11.82s).'
          }
        ]
      }
    }
  });

  console.log('[Seed] Shortlist created with shortlisted athletes');

  // 7. Audit log entries
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_BOOTSTRAP_5_PROTOCOLS',
      entityType: 'SYSTEM',
      details: { environment: 'development', version: '2.0.0', protocolsLoaded: 5 }
    }
  });

  console.log('[Seed] Database seed completed with all 5 required tests!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
