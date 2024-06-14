import { Sequelize , Model, DataTypes } from "sequelize";
import { sequelize } from "../instance";


class Chat extends Model {
    declare id: string
    declare chat_name: string
    declare have_unseen_sms: boolean
    declare is_answered: boolean
    declare last_sms_time: string
}

export default Chat.init({
    id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    chat_name: { type: DataTypes.STRING },
    have_unseen_sms: { type: DataTypes.BOOLEAN },
    is_answered: { type: DataTypes.BOOLEAN, },
    last_sms_time: { type: DataTypes.STRING, },
    fts_vector: { type: DataTypes.TSVECTOR }
}, { 
    sequelize, modelName: 'chats', 
    indexes: [{ name: 'chats_fts', fields: ['chat_name'], type: 'FULLTEXT' }] 
})

Chat.afterSync(async () => {
    try {
        const is_vector_triger_exist = await sequelize.query(`
            SELECT trigger_name
            FROM information_schema.triggers
            WHERE event_object_table = 'chats'
            AND trigger_name = 'chats_vector_update'
        `)
        if(!is_vector_triger_exist[0].length) {
            sequelize.query(`
                CREATE TRIGGER chats_vector_update BEFORE INSERT OR UPDATE ON chats FOR EACH ROW
                EXECUTE PROCEDURE tsvector_update_trigger("fts_vector", 'pg_catalog.english', chat_name)
            `)
        }
    } catch (error) {
        
    }
})
