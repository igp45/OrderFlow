import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service';

export async function predictDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prediction = await aiService.predictDemand();
    res.json(prediction);
  } catch (err) {
    next(err);
  }
}
