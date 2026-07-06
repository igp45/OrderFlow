import { Router } from 'express';
import { predictDemand } from '../controllers/ai.controller';

const router = Router();

router.post('/predict', predictDemand);

export default router;
