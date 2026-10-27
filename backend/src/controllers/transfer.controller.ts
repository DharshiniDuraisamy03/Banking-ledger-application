import { Request, Response, NextFunction } from 'express';
import { transferService } from '../services/transfer.service.js';

export class TransferController {
  public createTransfer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = transferService.executeTransfer(req.body);
      res.status(201).json({
        status: 'success',
        message: `Transfer of $${result.transfer.amount} from '${result.sourceAccount.name}' to '${result.destinationAccount.name}' completed successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAllTransfers = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const transfers = transferService.getAllTransfers();
      res.status(200).json({
        status: 'success',
        count: transfers.length,
        data: transfers,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTransferById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const transfer = transferService.getTransferById(id);
      res.status(200).json({
        status: 'success',
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const transferController = new TransferController();
