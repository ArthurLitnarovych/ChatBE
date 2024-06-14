import { config } from "../config"
import Database from "../database"
import { log } from "..";
import { Op, Sequelize, fn } from "sequelize"

export class Chat {

    static async createChat(req: any, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            const { chat_name, first_user, second_user } = req.body;

            const participants = await Database.users.findAll({
                where: {
                  id: {
                    [Op.in]: [first_user, second_user]
                  }
                }, transaction
              });

            if (participants.length != 2) {
                throw new Error('Wrong users')
            }

            const chat = await Database.chats.create({chat_name: chat_name, have_unseen_sms: false, is_answered: false, last_sms_time: "recently"}, { transaction })

            const part1 = await Database.participants.create({chat_id: chat.id, user_id: first_user}, {transaction})
            const part2 = await Database.participants.create({chat_id: chat.id, user_id: second_user}, {transaction})

            await transaction.commit()
            res.status(200).json({ chat, part1, part2 })
        } catch (error: any) {
            await transaction.rollback()
            log.error(error)
            res.status(400).json({ error: error.message })
            
        }
    }

    static async deleteChat(req: any, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            const { id } = req.body;

            const deletedChat = Database.chats.destroy({ where: {id}})

            await transaction.commit()
            res.status(200).json({ deletedChat })
        } catch (error: any) {
            await transaction.rollback()
            log.error(error)
            res.status(400).json({ error: error.message })
            
        }
    }

    static async updateChat(req: any, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            await Database.chats.update(req.body, { where: { number: req.params.id }, transaction })

            const chat = await Database.chats.findOne({
                where: { number: req.params.id },
                include: [{ model: Database.messages, required: false, as: 'messages', order: [['createdAt', 'DESC']], limit: 1 }],
                transaction,
            })
            
            await transaction.commit()
            res.status(200).json({ chat: chat?.dataValues })
        } catch (error: any) {
            console.log(error)
            await transaction.rollback()
            res.status(400).json({ error: error.message })
        }
    }

    static async getChats(req: any, res: any) {
        const transaction = await Database.instance.transaction()
        try {
            const id = req.params.id
            const parts = await Database.participants.findAll({
                where: {user_id: id},
                include: [{ model: Database.chats, where: { id }}]
            })
            await transaction.commit()
            res.status(200).json({ parts  })
        } catch (err: any) {
            log.error(err)
            await transaction.rollback()
            res.status(400).json({ error: err.message })
        }
    }

}