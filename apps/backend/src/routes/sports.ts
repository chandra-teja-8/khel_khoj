import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// List all sports
router.get('/', async (req: Request, res: Response) => {
  try {
    const sports = await prisma.sport.findMany({
      include: {
        protocols: {
          select: {
            id: true,
            code: true,
            name: true,
            version: true,
            status: true
          }
        },
        _count: {
          select: { athletes: true, assessments: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json(sports);
  } catch (error) {
    console.error('[Sports Error]', error);
    return res.status(500).json({ error: 'Failed to fetch sports.' });
  }
});

// Sport details by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sport = await prisma.sport.findUnique({
      where: { id: req.params.id },
      include: {
        protocols: true
      }
    });

    if (!sport) {
      return res.status(404).json({ error: 'Sport not found.' });
    }

    return res.json(sport);
  } catch (error) {
    console.error('[Sport Detail Error]', error);
    return res.status(500).json({ error: 'Failed to fetch sport detail.' });
  }
});

export default router;
