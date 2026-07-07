import { Request, Response, NextFunction } from 'express';
import * as menuService from '../services/menu.service';
import { createMenuItemSchema, updateMenuItemSchema } from '../validators/menu.validators';

export async function getMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await menuService.getAllMenuItems();
    res.json(items);
  } catch (err) { next(err); }
}

export async function createMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createMenuItemSchema.parse(req.body);
    const item = await menuService.createMenuItem(body);
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateMenuItemSchema.parse(req.body);
    const item = await menuService.updateMenuItem(req.params['id'] as string, body);
    res.json(item);
  } catch (err) { next(err); }
}

export async function deleteMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await menuService.deleteMenuItem(req.params['id'] as string);
    res.status(204).send();
  } catch (err) { next(err); }
}
