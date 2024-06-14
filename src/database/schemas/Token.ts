import { Model, DataTypes } from "sequelize";
import { sequelize } from "../instance";

class Token extends Model {
    declare user_id: string
    declare refresh_token: string
    declare fingerprint: string
}

export default Token.init({
    user_id: { type: DataTypes.STRING, primaryKey: true },
    refresh_token: { type: DataTypes.STRING, primaryKey: true },
    fingerprint: { type: DataTypes.STRING, primaryKey: true },
}, { sequelize, modelName: 'tokens' })
