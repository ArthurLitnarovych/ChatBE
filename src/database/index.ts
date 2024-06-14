import { log } from ".."
import { sequelize } from "./instance"
import Chat from "./schemas/Chat"
import Message from "./schemas/Message"
import Participant from "./schemas/Participant"
import Token from "./schemas/Token"
import User from "./schemas/User"

sequelize.sync()

Chat.hasMany(Message, { sourceKey: 'id', foreignKey: 'chat_number', as: 'messages', onDelete: 'CASCADE', onUpdate: 'CASCADE', hooks: true })
Chat.belongsToMany(User, { through: Participant, foreignKey: 'chat_id', otherKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
User.belongsToMany(Chat, { through: Participant, foreignKey: 'user_id', otherKey: 'chat_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Token.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' })

export default class Database {
    static instance = sequelize
    
    static users = User
    static tokens = Token
    static chats = Chat
    static messages = Message
    static participants = Participant
}