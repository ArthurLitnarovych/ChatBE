import { Sequelize , Model, DataTypes } from "sequelize";
import { sequelize } from "../instance";


class Message extends Model {
    declare id: string
    declare chat_number: string
    declare sender_id: string
    declare status: string
    declare text: string

}

export default Message.init({
    id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    chat_number: { type: DataTypes.STRING, primaryKey: true },
    sender_id: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING },
    text: { type: DataTypes.STRING },

    fts_vector: { type: DataTypes.TSVECTOR }
}, { 
    sequelize, modelName: 'messages', 
    indexes: [
        { name: 'messages_fts', fields: ['chat_number', 'text'], type: 'FULLTEXT' },
        // { name: 'sms_search', fields: ['direction', 'createdAt', 'fts_vector'] },
    ] 
})

Message.afterSync(async () => {
    try {
        const is_vector_triger_exist = await sequelize.query(`
            SELECT trigger_name
            FROM information_schema.triggers
            WHERE event_object_table = 'messages'
            AND trigger_name = 'messages_vector_update'
        `)
        if(!is_vector_triger_exist[0].length) {
            sequelize.query(`
                CREATE TRIGGER messages_vector_update BEFORE INSERT OR UPDATE ON messages FOR EACH ROW
                EXECUTE PROCEDURE tsvector_update_trigger("fts_vector", 'pg_catalog.english', chat_number, text)
            `)
        }
    } catch (error) {
        
    }
})
