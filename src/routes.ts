import express from 'express'
import { Auth } from './services/auth'
import { Users } from './services/user'
import { authMiddleware } from './services/middleware'
import { Chat } from './services/chat'
export const router = express.Router()

//auth
router.post('/auth/signin', Auth.login)
router.post('/auth/logout', Auth.logout)
router.post('/auth/refresh', Auth.refresh)
router.post('/auth/password', authMiddleware, Auth.password)

//users
router.post('/users', Users.create)
router.get('/users', authMiddleware, Users.getAll)
router.get('/users/autocomplete', authMiddleware, Users.autocomplete)
router.get('/users/:id', authMiddleware, Users.get)
router.post('/users/:id', authMiddleware, Users.update)

//chats
router.post('/chat', Chat.createChat)
router.get('/chats/:id', Chat.getChats)


