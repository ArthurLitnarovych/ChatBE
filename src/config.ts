import dotenv from "dotenv"
dotenv.config()

export const config = {
    database: {
        name: process.env.DATABASE_NAME || 'chat',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USER || 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        password: process.env.DATABASE_PASSWORD || '',
    },
    jwt: {
        access_secret: process.env.JWT_ACCESS_SECRET || 'access_secret',
        refresh_secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        access_expiration: 18e5,
        refresh_settings: { maxAge: 1296e6, httpOnly: true },
    },
    client_url: process.env.CLIENT_URL || 'http://localhost:3000',
}