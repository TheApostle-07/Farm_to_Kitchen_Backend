import { Request, Response, NextFunction } from 'express'

export const isFarmer = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'FARMER') {
    return next()
  }
  return res.status(403).json({ error: 'Only farmers can perform this action' })
}