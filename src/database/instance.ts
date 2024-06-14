import { Sequelize } from "sequelize"
import { Client } from "pg"
import { config } from "../config";
import { createLogger } from "bunyan";
import { log } from "..";


export const sequelize = new Sequelize(
    config.database.name, 
    config.database.user, 
    config.database.password, 
    {
    host: config.database.host,
    port: config.database.port,
    dialect: "postgres",
    logging: msg => log.info(msg),
    },
);