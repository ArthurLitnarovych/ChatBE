import jwt, { JwtPayload } from 'jsonwebtoken'
import { Response, NextFunction } from 'express'
import { config } from '../config'

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req?.headers?.authorization?.split(' ')[1]
    let decodedData: JwtPayload | string
  
    try {
      decodedData = jwt.verify(
        token,
        config.jwt.access_secret,
      );
    } catch (error: any) {
      return res.status(401).json({message: 'Unauthorized', error: error.message})
    }
    
    if(typeof decodedData === 'string') {
      req.auth.userId = decodedData
    } else {
      req.auth = {
            userId: decodedData.id,
            userRole: decodedData.role
        }
    }

    next()
  } catch (error: any) {
    return res.status(401).json({message: 'Unauthorized', error: error.message})
  }
}