import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve(__dirname, '../../../../storage');
const VIDEO_DIR = path.join(STORAGE_DIR, 'videos');
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEO_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${uuidv4()}${ext}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Allowed: MP4, MOV, AVI, WEBM'));
    }
  }
});

// Upload video and create assessment
router.post('/upload', authenticate, upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    const { sportId, protocolId } = req.body;
    if (!sportId || !protocolId) {
      return res.status(400).json({ error: 'sportId and protocolId are required.' });
    }

    // Ensure athlete profile exists
    let athleteProfile = await prisma.athleteProfile.findUnique({
      where: { userId: req.user!.id }
    });

    if (!athleteProfile) {
      // Create a default profile if missing
      athleteProfile = await prisma.athleteProfile.create({
        data: {
          userId: req.user!.id,
          fullName: req.user!.email.split('@')[0],
          dateOfBirth: new Date('2005-01-01'),
          gender: 'Not specified',
          state: 'National',
          district: 'Central'
        }
      });
    }

    const protocol = await prisma.testProtocol.findUnique({
      where: { id: protocolId }
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Selected protocol not found.' });
    }

    if (protocol.sportId !== sportId) {
      return res.status(400).json({ error: 'Protocol does not belong to the selected sport.' });
    }

    const relPath = path.relative(path.resolve(__dirname, '../../../../'), req.file.path).replace(/\\/g, '/');

    const assessment = await prisma.assessment.create({
      data: {
        athleteId: athleteProfile.id,
        sportId,
        protocolId,
        protocolVersion: protocol.version,
        status: AssessmentStatus.UPLOADED,
        videoPath: relPath,
        videoOriginalName: req.file.originalname,
        videoMimeType: req.file.mimetype,
        videoSize: req.file.size
      },
      include: {
        sport: true,
        protocol: true
      }
    });

    return res.status(201).json({
      message: 'Video uploaded successfully. Assessment created.',
      assessment
    });
  } catch (error: any) {
    console.error('[Upload Error]', error);
    return res.status(500).json({ error: error.message || 'Video upload failed.' });
  }
});

// Process assessment through AI Service
router.post('/:id/process', authenticate, async (req: Request, res: Response) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        athlete: true,
        protocol: true,
        sport: true
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    // Athlete can only process their own assessment (unless admin)
    if (req.user!.role !== 'SAI_ADMIN' && assessment.athlete.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to process this assessment.' });
    }

    // State transition to QUEUED -> PROCESSING
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: AssessmentStatus.PROCESSING }
    });

    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const absoluteVideoPath = path.resolve(__dirname, '../../../../', assessment.videoPath);

    // Call Python FastAPI AI service with a 3-minute timeout
    const response = await fetch(`${aiUrl}/process-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoPath: absoluteVideoPath,
        protocolCode: assessment.protocol.code,
        assessmentId: assessment.id
      }),
      signal: AbortSignal.timeout(180000)
    });

    if (!response.ok) {
      const errText = await response.text();
      await prisma.assessment.update({
        where: { id: assessment.id },
        data: {
          status: AssessmentStatus.FAILED,
          failureReason: `AI Service returned ${response.status}: ${errText}`
        }
      });
      return res.status(502).json({ error: 'AI video processing service failed.' });
    }

    const aiResult = await response.json();

    // Check validation / retake outcome
    if (aiResult.needsRetake || !aiResult.validationPassed) {
      const updated = await prisma.assessment.update({
        where: { id: assessment.id },
        data: {
          status: AssessmentStatus.NEEDS_RETAKE,
          failureReason: aiResult.failureReason || 'Video quality did not meet protocol tracking requirements.'
        }
      });
      return res.json({
        message: 'Assessment requires video retake',
        assessment: updated,
        aiResult
      });
    }

    // Save AssessmentResult in transaction and mark COMPLETED
    const enrichedDerivedMetrics = {
      ...(aiResult.derivedMetrics || {}),
      geminiAdvice: aiResult.geminiAdvice || null,
      detectedActivity: aiResult.detectedActivity || null,
    };

    const savedResult = await prisma.$transaction(async (tx) => {
      // Upsert result to maintain idempotency
      const result = await tx.assessmentResult.upsert({
        where: { assessmentId: assessment.id },
        create: {
          assessmentId: assessment.id,
          overallScore: aiResult.overallScore,
          confidenceScore: aiResult.confidenceScore,
          validationPassed: true,
          rawMetrics: aiResult.rawMetrics,
          derivedMetrics: enrichedDerivedMetrics,
          evidenceFrames: aiResult.evidenceFrames,
          validationFlags: aiResult.validationFlags,
          modelName: aiResult.modelName || 'yolo11n-pose',
          modelVersion: aiResult.modelVersion || '11n-1.0'
        },
        update: {
          overallScore: aiResult.overallScore,
          confidenceScore: aiResult.confidenceScore,
          validationPassed: true,
          rawMetrics: aiResult.rawMetrics,
          derivedMetrics: enrichedDerivedMetrics,
          evidenceFrames: aiResult.evidenceFrames,
          validationFlags: aiResult.validationFlags
        }
      });

      const updatedAssessment = await tx.assessment.update({
        where: { id: assessment.id },
        data: {
          status: AssessmentStatus.COMPLETED,
          durationSeconds: aiResult.rawMetrics?.videoDurationSec || null
        },
        include: {
          result: true,
          sport: true,
          protocol: true
        }
      });

      return { result, assessment: updatedAssessment };
    });

    const mappedResult = {
      ...savedResult.result,
      geminiAdvice: aiResult.geminiAdvice || null,
      detectedActivity: aiResult.detectedActivity || null
    };

    const mappedAssessment = {
      ...savedResult.assessment,
      result: savedResult.assessment.result ? {
        ...savedResult.assessment.result,
        geminiAdvice: aiResult.geminiAdvice || null,
        detectedActivity: aiResult.detectedActivity || null
      } : null
    };

    return res.json({
      message: 'Assessment completed successfully',
      assessment: mappedAssessment,
      result: mappedResult
    });
  } catch (error: any) {
    console.error('[Process Assessment Error]', error);
    await prisma.assessment.update({
      where: { id: req.params.id },
      data: {
        status: AssessmentStatus.FAILED,
        failureReason: error.message || 'Processing failed'
      }
    }).catch(() => {});
    return res.status(500).json({ error: error.message || 'Internal error during video processing.' });
  }
});

// List current athlete's assessments
router.get('/my', authenticate, async (req: Request, res: Response) => {
  try {
    const profile = await prisma.athleteProfile.findUnique({
      where: { userId: req.user!.id }
    });

    if (!profile) {
      return res.json([]);
    }

    const assessments = await prisma.assessment.findMany({
      where: { athleteId: profile.id },
      include: {
        sport: true,
        protocol: true,
        result: true,
        adminReviews: {
          include: {
            reviewer: { select: { email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = assessments.map(a => {
      if (!a.result) return a;
      const dm = a.result.derivedMetrics as any;
      return {
        ...a,
        result: {
          ...a.result,
          geminiAdvice: dm?.geminiAdvice || null,
          detectedActivity: dm?.detectedActivity || null
        }
      };
    });

    return res.json(mapped);
  } catch (error) {
    console.error('[My Assessments Error]', error);
    return res.status(500).json({ error: 'Failed to fetch assessments.' });
  }
});

// Assessment status endpoint (polling)
router.get('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        failureReason: true,
        retryCount: true,
        updatedAt: true,
        result: {
          select: {
            overallScore: true,
            confidenceScore: true,
            validationPassed: true
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    return res.json(assessment);
  } catch (error) {
    console.error('[Assessment Status Error]', error);
    return res.status(500).json({ error: 'Failed to fetch assessment status.' });
  }
});

// Assessment details by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        athlete: {
          include: { user: { select: { email: true } } }
        },
        sport: true,
        protocol: true,
        result: true,
        adminReviews: {
          include: {
            reviewer: { select: { email: true } }
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    // Role guard: Athletes can only view their own
    if (req.user!.role !== 'SAI_ADMIN' && assessment.athlete.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const dm = assessment.result?.derivedMetrics as any;
    const mapped = {
      ...assessment,
      result: assessment.result ? {
        ...assessment.result,
        geminiAdvice: dm?.geminiAdvice || null,
        detectedActivity: dm?.detectedActivity || null
      } : null
    };

    return res.json(mapped);
  } catch (error) {
    console.error('[Assessment Detail Error]', error);
    return res.status(500).json({ error: 'Failed to fetch assessment detail.' });
  }
});

export default router;
