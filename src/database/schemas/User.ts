import { Model, DataTypes } from "sequelize"
import { sequelize } from "../instance"
import { log } from "../.."

class User extends Model {
    declare id: string
    declare firstname: string
    declare lastname: string
    declare email: string
    declare role: string
    declare password: string
}

export default User.init({
    id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstname: { type: DataTypes.STRING },
    lastname: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING },
    fts_vector: { type: DataTypes.TSVECTOR },
}, { sequelize, modelName: "users", 
    indexes: [{ name: 'users_fts', fields: ['firstname', 'lastname'], type: 'FULLTEXT' }] })

User.afterSync(async () => {
        try {
            const is_vector_triger_exist = await sequelize.query(`
                SELECT trigger_name
                FROM information_schema.triggers
                WHERE event_object_table = 'users'
                AND trigger_name = 'users_vector_update'
            `)
            if(!is_vector_triger_exist[0].length) {
                sequelize.query(`
                    CREATE TRIGGER users_vector_update BEFORE INSERT OR UPDATE ON users FOR EACH ROW
                    EXECUTE PROCEDURE tsvector_update_trigger("fts_vector", 'pg_catalog.english', firstname, lastname)
                `)
            }
        } catch (error) {
            log.error(error)
        }
})