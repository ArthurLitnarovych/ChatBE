import express from 'express'
import cors from 'cors'
import path from 'path'
import ExpressFingerprint from "express-fingerprint"
import Database from './database'
import pino from 'pino'
import pinoPretty from 'pino-pretty'
import { router } from './routes'
import cookieParser from "cookie-parser"

const app = express()
const Fingerprint: any = ExpressFingerprint

app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true}))
// app.use(cors())
app.use(express.json())
app.use(Fingerprint({ parameters: [ Fingerprint.useragent, Fingerprint.acceptHeaders ] }))
app.use(express.static(path.join(__dirname, '..', 'build')))
app.use('/api', router)
// app.use('/', (req, res) => { res.sendFile(path.join(__dirname, '..', 'build', 'index.html')) })

const pr = pinoPretty({
    colorize: true,
    translateTime: 'yyyy-mm-dd HH:MM:ss.l',
    ignore: 'pid,hostname', 
    singleLine: true,
});

export const log = pino(pr);

try {
    Database.instance.authenticate().then(() => log.info("Connection to database established succesfully!")).catch((err) => log.error(err))

    app.listen(8080, () => log.info("App is running on 8080 port!"))
} catch (err) {
    log.error(err)
}