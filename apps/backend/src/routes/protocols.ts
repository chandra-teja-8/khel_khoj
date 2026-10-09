import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// List protocols with optional sport filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sportId, status } = req.query;

    const where: any = {};
    if (sportId && typeof sportId === 'string') {
      where.sportId = sportId;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const protocols = await prisma.testProtocol.findMany({
      where,
      include: {
        sport: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json(protocols);
  } catch (error) {
    console.error('[Protocols Error]', error);
    return res.status(500).json({ error: 'Failed to fetch protocols.' });
  }
});

// Protocol detail by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const protocol = await prisma.testProtocol.findUnique({
      where: { id: req.params.id },
      include: {
        sport: true
      }
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found.' });
    }

    return res.json(protocol);
  } catch (error) {
    console.error('[Protocol Detail Error]', error);
    return res.status(500).json({ error: 'Failed to fetch protocol detail.' });
  }
});

export default router;
