import { config } from "../config"
import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt'
import Database from "../database"
import { log } from "..";

export class Auth {
    
    static async login(req: { body?: any; fingerprint?: any }, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            const { email, password } = req.body
            const { fingerprint } = req

            const user = await Database.users.findOne({ where: { email }, transaction})
            if (!user) {
                throw new Error("User doesn't exist!")
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password)
            if (!isPasswordValid) {
                throw new Error("Wrong credentials!")
            }

            const payload = { role: user.role, id: user.id, email: user.email }

            const refreshToken = TokenService.generateRefreshToken(payload)
            const accessToken = TokenService.generateAccessToken(payload)

            await Database.tokens.destroy({ where: {user_id: user.id, fingerprint: fingerprint?.hash}, transaction})
            await Database.tokens.create({user_id: user.id, refresh_token: refreshToken, fingerprint: fingerprint?.hash}, { transaction })

            res.cookie("refreshToken", refreshToken, config.jwt.refresh_settings)
            await transaction.commit()
            res.status(200).json({ accessToken, accessTokenExpiration: config.jwt.access_expiration, user: user.dataValues})

        } catch (err: any) {
            await transaction.rollback()
            res.status(400).json({ error: err.message })
            log.error(err)
        }   
    }

    static async logout(req: { cookies?: any; fingerprint?: any; }, res: any) {
      const transaction = await Database.instance.transaction()
      try {
          const { fingerprint } = req;
          const refreshToken = req.cookies.refreshToken;
          await Database.tokens.destroy({ where: { refresh_token: refreshToken, fingerprint: fingerprint?.hash }, transaction })

          res.clearCookie("refreshToken");
          await transaction.commit()
          res.status(200).json({ })
      } catch (error: any) {
          await transaction.rollback()
          res.status(400).json({ error: error.message })
          log.error(error)
      }
    }

    static async password(req: { body: { current_password: any; new_password: any; }; auth: { userId: any; }; }, res: any) {
      const transaction = await Database.instance.transaction()
      try {
          const { current_password, new_password } = req.body
          const { userId } = req.auth
          
          const me = await Database.users.findOne({ where: { id: userId }, transaction })
          if (!await bcrypt.compare(current_password, me?.password as string)) throw Error('Wrong current password')
          const hashPassword = await bcrypt.hash(new_password, 6)
          await Database.users.update({ password: hashPassword }, { where: { id: userId }, transaction })

          await transaction.commit()
          res.status(200).json({ success: true })
      } catch (error: any) {
          await transaction.rollback()
          res.status(400).json({ error: error.message })
          log.error(error)
      }
    }

    static async refresh(req: { cookies?: any; fingerprint?: any; }, res: any) {
      const transaction = await Database.instance.transaction()
      try {
          const { fingerprint } = req;
          const currentRefreshToken = req.cookies.refreshToken
         
          if (!currentRefreshToken) {
              throw Error('Unauthorized1');
          }
      
          const refreshSession = await Database.tokens.findOne({ 
              where: { refresh_token: currentRefreshToken, fingerprint: fingerprint?.hash }, 
              transaction 
          })
      
          if (!refreshSession) {
          throw Error('Unauthorized');
          }
      
          if (refreshSession.fingerprint !== fingerprint?.hash) {
              throw Error("Unauthorized")
          }
      
          await Database.tokens.destroy({ where: { refresh_token: currentRefreshToken, fingerprint: fingerprint?.hash }, transaction })
      
          let tokenData: any;
          try {
              tokenData = TokenService.verifyRefreshToken(currentRefreshToken);
          } catch (error) {
              throw Error("Unauthorized")
          }
  
          const user = await Database.users.findOne({ where: { email: tokenData.email }, transaction })
      
          const payload = { id: user?.id, email: user?.email, role: user?.role };
      
          const accessToken = TokenService.generateAccessToken(payload);
          const refreshToken = TokenService.generateRefreshToken(payload);
      
          await Database.tokens.create({ user_id: user?.id, refresh_token: refreshToken, fingerprint: fingerprint?.hash }, { transaction })

          res.cookie("refreshToken", refreshToken, config.jwt.refresh_settings);
          await transaction.commit()
          res.status(200).json({ accessToken, accessTokenExpiration: config.jwt.access_expiration, user: user?.dataValues })
      } catch (error: any) {
          await transaction.rollback()
          res.status(400).json({ error: error.message })
          log.error(error)
      }
    }
}

export class TokenService {

    static generateAccessToken(payload: any) {
      return jwt.sign(payload, config.jwt.access_secret, {
        expiresIn: "30m",
      });
    }
  
    static generateRefreshToken(payload: any) {
      return jwt.sign(payload, config.jwt.refresh_secret, {
        expiresIn: "15d",
      });
    }
  
    // static async verifyAccessToken(accessToken) {
    //   return await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    // }
  
    static verifyRefreshToken(refreshToken: string) {
      return jwt.verify(refreshToken, config.jwt.refresh_secret);
    }
}