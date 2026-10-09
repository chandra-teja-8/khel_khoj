import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_khelkhoj_dev_2026';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  dateOfBirth: z.string(), // ISO string YYYY-MM-DD
  gender: z.string(),
  state: z.string(),
  district: z.string(),
  primarySportId: z.string().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  emergencyContact: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Athlete Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
    }

    const { email, password, fullName, dateOfBirth, gender, state, district, primarySportId, heightCm, weightKg, emergencyContact } = parse.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.ATHLETE, // Always ATHLETE for public registration
        profile: {
          create: {
            fullName,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            state,
            district,
            primarySportId: primarySportId || null,
            heightCm: heightCm || null,
            weightKg: weightKg || null,
            emergencyContact: emergencyContact || null
          }
        }
      },
      include: { profile: true }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('[Register Error]', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login (Athlete or SAI Admin)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid email or password format.' });
    }

    const { email, password } = parse.data;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Current Authenticated User Profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      profile: {
        include: { primarySport: true }
      }
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.profile
  });
});

export default router;
