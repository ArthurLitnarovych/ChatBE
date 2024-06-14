import { log } from "..";
import { config } from "../config"
import Database from "../database"
import bcrypt from 'bcrypt'
import { Op, fn } from "sequelize"
import { TokenService } from "./auth";

export class Users {

    static async get(req: any, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            const { id } = req.params
            
            log.error(id)
            const user = await Database.users.findOne({ where: { id }, transaction})
            if (!user) {
                throw new Error("User with this id doesn't exist!")
            }

            const { firstname, lastname, email, role, createdAt  } = user.dataValues
            
            await transaction.commit()
            res.status(200).json({ user: {id, firstname, lastname, email, role, createdAt} })
        } catch (error: any) {
            await transaction.rollback()
            res.status(400).json({ error: error.message })
        }
    }
    
    static async getAll(req: { query: { page: string; limit: string }; auth: { userId: any } }, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            
            const limit = parseInt(req.query.limit as string) || 8
            const offset = (parseInt(req.query.page as string) - 1) * limit || 0

            const users = await Database.users.findAll({
                where: { id: { [Op.ne]: req.auth.userId } },
                offset,
                limit,
                transaction
            })

            const count = await Database.users.count()

            await transaction.commit()
            res.status(200).json({ users, pagesCount: count })
        } catch (error: any) {
            console.log(error)
            await transaction.rollback()
            res.status(400).json({ error: error.message })
        }
    }

    static async create(req: { body?: any; fingerprint?: any }, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            const { password, email } = req.body
            const { fingerprint } = req
            const hashPassword = bcrypt.hashSync(password, 6)

            const existingUser = await Database.users.findOne({ where: { email }})

            if (existingUser) {
                throw new Error('User already exists!')
            }

            const user = await Database.users.create({...req.body, password: hashPassword, email: email, role: 'user', fts_vector: ''}, { transaction })

            if (!user) {
                throw new Error("Err")
            }

            const payload = { role: user.role, id: user.id, email: user.email }

            const refreshToken = TokenService.generateRefreshToken(payload)
            const accessToken = TokenService.generateAccessToken(payload)

            await Database.tokens.create({user_id: user.id, refresh_token: refreshToken, fingerprint: fingerprint?.hash}, { transaction })

            res.cookie("refreshToken", refreshToken, config.jwt.refresh_settings)
            await transaction.commit()
            res.status(200).json({ accessToken, accessTokenExpiration: config.jwt.access_expiration, user: user.dataValues, message: 'User was created!'})
        } catch(err: any) {
            await transaction.rollback()
            log.error(err)
            res.status(400).json({ error: err.message })
        }
    }

    static async autocomplete(req: any, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            const text: string = String(req.query.text)
            console.log(text)

            const limit = parseInt(req.query.limit as string) || 8
            const offset = (parseInt(req.query.page as string) - 1) * limit || 0

            const users = await Database.users.findAll({
                where: text ? { fts_vector: { [Op.match]: fn('to_tsquery', `${decodeURIComponent(text.replace(' ', '*'))}:*`) } } : {},
                limit,
                offset,
                transaction,
            })

            const count = await Database.users.count({
                where: text ? { fts_vector: { [Op.match]: fn('to_tsquery', `${decodeURIComponent(text.replace(' ', '*'))}:*`) } } : {},
                transaction,
            })
            
            await transaction.commit()
            res.status(200).json({ users: users.length ? users : null, pagesCount: count })
        } catch (error: any) {
            log.error(error)
            await transaction.rollback()
            res.status(400).json({ error: error.message })
        }
    }

    static async update(req: { params: { id: any }; body: any }, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            const { id } = req.params
            await Database.users.update(req.body, { where: { id }, transaction })
            const user = await Database.users.findOne({ where: { id }, transaction })

            await transaction.commit()
            res.status(200).json({ user: user?.dataValues })
        } catch (error: any) {
            await transaction.rollback()
            res.status(400).json({ error: error.message })
        }
    }
}