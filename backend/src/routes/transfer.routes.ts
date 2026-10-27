import { Router } from 'express';
import { transferController } from '../controllers/transfer.controller.js';
import { validateBody } from '../middleware/validate.js';
import { createTransferSchema } from '../schemas/transfer.schema.js';

const router = Router();

router.post(
  '/',
  validateBody(createTransferSchema),
  transferController.createTransfer
);

router.get(
  '/',
  transferController.getAllTransfers
);

router.get(
  '/:id',
  transferController.getTransferById
);

export const transferRouter = router;
