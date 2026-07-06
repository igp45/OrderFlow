import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/order.service';
import { createOrderSchema, updateStatusSchema } from '../validators/order.validators';

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createOrderSchema.parse(req.body);
    const order = await orderService.createOrder(body, req.app.locals.io);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.getOrderById(req.params['id'] as string);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateStatusSchema.parse(req.body);
    const order = await orderService.updateOrderStatus(req.params['id'] as string, body.status, req.app.locals.io);
    res.json(order);
  } catch (err) {
    next(err);
  }
}
