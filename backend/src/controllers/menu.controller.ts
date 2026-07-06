import { Request, Response, NextFunction } from 'express';
import * as menuService from '../services/menu.service';

export async function getMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await menuService.getAllMenuItems();
    res.json(items);
  } catch (err) {
    next(err);
  }
}
