import { Sequelize , Model, DataTypes } from "sequelize";
import { sequelize } from "../instance";


class Participant extends Model {
    declare chat_id: string
    declare user_id: string
}

export default Participant.init({
    chat_id: { type: DataTypes.STRING, primaryKey: true },
    user_id: { type: DataTypes.STRING, primaryKey: true },
}, { 
    sequelize, modelName: 'participants', 
})
