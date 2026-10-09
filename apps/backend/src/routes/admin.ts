import { Router, Request, Response } from 'express';
import { Role, ReviewDecision, AssessmentStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth + SAI_ADMIN guard to all routes in this router
router.use(authenticate, requireRole(Role.SAI_ADMIN));

// Overview Analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const totalAthletes = await prisma.athleteProfile.count();
    const totalAssessments = await prisma.assessment.count();
    const completedAssessments = await prisma.assessment.count({
      where: { status: AssessmentStatus.COMPLETED }
    });
    const retakeAssessments = await prisma.assessment.count({
      where: { status: AssessmentStatus.NEEDS_RETAKE }
    });
    const pendingReviews = await prisma.assessment.count({
      where: {
        status: AssessmentStatus.COMPLETED,
        adminReviews: { none: {} }
      }
    });

    const approvedReviews = await prisma.adminReview.count({
      where: { decision: ReviewDecision.APPROVED }
    });

    const scoreAgg = await prisma.assessmentResult.aggregate({
      _avg: { overallScore: true },
      _max: { overallScore: true }
    });

    // Assessments by Sport
    const sportsWithCounts = await prisma.sport.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: { assessments: true, athletes: true }
        }
      }
    });

    // Athletes by State
    const athletesByState = await prisma.athleteProfile.groupBy({
      by: ['state'],
      _count: { _all: true },
      orderBy: { _count: { state: 'desc' } },
      take: 8
    });

    return res.json({
      summary: {
        totalAthletes,
        totalAssessments,
        completedAssessments,
        retakeAssessments,
        pendingReviews,
        approvedReviews,
        averageScore: scoreAgg._avg.overallScore ? Number(scoreAgg._avg.overallScore.toFixed(1)) : 0,
        topScore: scoreAgg._max.overallScore ? Number(scoreAgg._max.overallScore.toFixed(1)) : 0
      },
      sportsDistribution: sportsWithCounts.map(s => ({
        sportId: s.id,
        name: s.name,
        code: s.code,
        assessmentsCount: s._count.assessments,
        athletesCount: s._count.athletes
      })),
      stateDistribution: athletesByState.map(s => ({
        state: s.state,
        count: s._count._all
      }))
    });
  } catch (error) {
    console.error('[Admin Analytics Error]', error);
    return res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

// Athletes Directory with Search & Pagination
router.get('/athletes', async (req: Request, res: Response) => {
  try {
    const { search, state, gender, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

    const where: any = {};
    if (search && typeof search === 'string') {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (state && typeof state === 'string') {
      where.state = state;
    }
    if (gender && typeof gender === 'string') {
      where.gender = gender;
    }

    const [total, athletes] = await Promise.all([
      prisma.athleteProfile.count({ where }),
      prisma.athleteProfile.findMany({
        where,
        include: {
          user: { select: { email: true, createdAt: true } },
          primarySport: { select: { name: true, code: true } },
          assessments: {
            where: { status: AssessmentStatus.COMPLETED },
            include: { result: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: { select: { assessments: true } }
        },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      athletes: athletes.map(a => ({
        id: a.id,
        fullName: a.fullName,
        email: a.user.email,
        gender: a.gender,
        dateOfBirth: a.dateOfBirth,
        state: a.state,
        district: a.district,
        sport: a.primarySport?.name || 'General Athletics',
        totalAssessments: a._count.assessments,
        latestScore: a.assessments[0]?.result?.overallScore || null,
        latestConfidence: a.assessments[0]?.result?.confidenceScore || null
      }))
    });
  } catch (error) {
    console.error('[Admin Athletes Error]', error);
    return res.status(500).json({ error: 'Failed to fetch athletes directory.' });
  }
});

// Admin Assessment Queue with Filtering
router.get('/assessments', async (req: Request, res: Response) => {
  try {
    const { status, sportId, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status as AssessmentStatus;
    }
    if (sportId && typeof sportId === 'string') {
      where.sportId = sportId;
    }
    if (search && typeof search === 'string') {
      where.athlete = {
        fullName: { contains: search, mode: 'insensitive' }
      };
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        athlete: true,
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

    return res.json(assessments);
  } catch (error) {
    console.error('[Admin Assessments Error]', error);
    return res.status(500).json({ error: 'Failed to fetch assessment queue.' });
  }
});

// Record Admin Review Decision (Does not alter original AI scores)
const reviewSchema = z.object({
  decision: z.nativeEnum(ReviewDecision),
  reviewNotes: z.string().min(5)
});

router.post('/assessments/:id/review', async (req: Request, res: Response) => {
  try {
    const parse = reviewSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid review payload', details: parse.error.format() });
    }

    const { decision, reviewNotes } = parse.data;

    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    const review = await prisma.adminReview.create({
      data: {
        assessmentId: assessment.id,
        reviewerId: req.user!.id,
        decision,
        reviewNotes
      },
      include: {
        reviewer: { select: { email: true } }
      }
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'ASSESSMENT_REVIEW_DECISION',
        entityType: 'ASSESSMENT',
        entityId: assessment.id,
        details: { decision, notesLength: reviewNotes.length }
      }
    });

    return res.status(201).json({
      message: 'Review decision recorded successfully',
      review
    });
  } catch (error) {
    console.error('[Admin Review Error]', error);
    return res.status(500).json({ error: 'Failed to record review.' });
  }
});

// Protocol-Compatible Leaderboard
// Master rule: Compare/rank only compatible athletes assessed using the same applicable sport/test/protocol version
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.query;
    if (!protocolId || typeof protocolId !== 'string') {
      return res.status(400).json({ error: 'protocolId query parameter is required to view a compatible leaderboard.' });
    }

    const protocol = await prisma.testProtocol.findUnique({
      where: { id: protocolId },
      include: { sport: true }
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found.' });
    }

    // Query strictly matching protocolId and protocolVersion
    const results = await prisma.assessmentResult.findMany({
      where: {
        protocolId: protocol.id,
        protocolVersion: protocol.version,
        validationPassed: true,
        overallScore: { not: null }
      },
      include: {
        assessment: {
          include: {
            athlete: {
              include: { user: { select: { email: true } } }
            }
          }
        }
      },
      orderBy: { overallScore: 'desc' },
      take: 50
    });

    return res.json({
      protocol: {
        id: protocol.id,
        name: protocol.name,
        code: protocol.code,
        version: protocol.version,
        sport: protocol.sport.name
      },
      rankings: results.map((r, index) => ({
        rank: index + 1,
        athleteId: r.assessment.athlete.id,
        athleteName: r.assessment.athlete.fullName,
        state: r.assessment.athlete.state,
        district: r.assessment.athlete.district,
        gender: r.assessment.athlete.gender,
        overallScore: r.overallScore,
        confidenceScore: r.confidenceScore,
        derivedMetrics: r.derivedMetrics,
        assessmentDate: r.createdAt
      }))
    });
  } catch (error) {
    console.error('[Leaderboard Error]', error);
    return res.status(500).json({ error: 'Failed to compute leaderboard.' });
  }
});

// Shortlist Management
router.get('/shortlists', async (req: Request, res: Response) => {
  try {
    const shortlists = await prisma.shortlist.findMany({
      include: {
        sport: true,
        creator: { select: { email: true } },
        entries: {
          include: {
            athlete: true,
            assessment: {
              include: { result: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(shortlists);
  } catch (error) {
    console.error('[Get Shortlists Error]', error);
    return res.status(500).json({ error: 'Failed to fetch shortlists.' });
  }
});

router.post('/shortlists', async (req: Request, res: Response) => {
  try {
    const { name, description, sportId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Shortlist name is required.' });
    }

    const shortlist = await prisma.shortlist.create({
      data: {
        name,
        description,
        sportId: sportId || null,
        creatorId: req.user!.id
      }
    });

    return res.status(201).json(shortlist);
  } catch (error) {
    console.error('[Create Shortlist Error]', error);
    return res.status(500).json({ error: 'Failed to create shortlist.' });
  }
});

router.post('/shortlists/:id/entries', async (req: Request, res: Response) => {
  try {
    const { athleteId, assessmentId, notes } = req.body;
    if (!athleteId) {
      return res.status(400).json({ error: 'athleteId is required.' });
    }

    const entry = await prisma.shortlistEntry.upsert({
      where: {
        shortlistId_athleteId: {
          shortlistId: req.params.id,
          athleteId
        }
      },
      create: {
        shortlistId: req.params.id,
        athleteId,
        assessmentId: assessmentId || null,
        notes: notes || null
      },
      update: {
        assessmentId: assessmentId || null,
        notes: notes || null
      }
    });

    return res.status(201).json(entry);
  } catch (error) {
    console.error('[Add Shortlist Entry Error]', error);
    return res.status(500).json({ error: 'Failed to add athlete to shortlist.' });
  }
});

router.delete('/shortlists/:id/entries/:athleteId', async (req: Request, res: Response) => {
  try {
    await prisma.shortlistEntry.delete({
      where: {
        shortlistId_athleteId: {
          shortlistId: req.params.id,
          athleteId: req.params.athleteId
        }
      }
    });

    return res.json({ message: 'Athlete removed from shortlist.' });
  } catch (error) {
    console.error('[Delete Shortlist Entry Error]', error);
    return res.status(500).json({ error: 'Failed to remove athlete from shortlist.' });
  }
});

// Audit Logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return res.json(logs);
  } catch (error) {
    console.error('[Audit Logs Error]', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

export default router;
