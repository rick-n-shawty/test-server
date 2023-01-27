import dotenv from 'dotenv';
dotenv.config()
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
const port = process.env.PORT || 5000
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: 'https://test-react-1mlb.onrender.com',
    credentials: true
}))
const db = [{id: 0, name: 'sam', password: '123'}]

const verify = (req, res, next) =>{
    const authHead = req.headers.authorization
    if(!authHead) return res.status(400).json({msg: "not authorized"})
    const token = authHead.split(' ')[1]
    jwt.verify(token, 'secret', (err, decoded) =>{
        if(err) return res.status(400).json({msg: 'some error'})
        req.userId = decoded.userId
        next()
    })
}

app.post('/register', (req, res) =>{
    const {name, password} = req.body
    const user = {id: db.length, name, password}
    db.push(user)
    const accessToken = jwt.sign({userId: user.id}, 'secret', {expiresIn: '20s'})
    const refreshToken = jwt.sign({userId: user.id}, 'refreshSecret')
    res.cookie('refreshToken', refreshToken, {httpOnly: true, domain: ".onrender.com", path: '/refresh_token'})
    res.status(200).json({msg: "you signed up", accessToken})
})
app.post('/login', (req, res) =>{
    const {name, password} = req.body
    const user = db.find(item => item.name === name)
    if(!user) return res.status(404).json({msg: 'user does not exist'})
    if(password !== user.password) return res.status(403).json({msg: 'wrong password'})
    const accessToken = jwt.sign({userId: user.id}, 'secret', {expiresIn: '20s'})
    const refreshToken = jwt.sign({userId: user.id}, 'refreshSecret')
    res.cookie('refreshToken', refreshToken, {httpOnly: true, domain: ".onrender.com", path: '/refresh_token'})
    res.status(200).json({msg:'you logged in', accessToken})
})
app.get('/secret', verify,(req, res) =>{
    const user = db.find(item => item.id == req.userId)
    const randomNum = Math.floor(Math.random() * 100)
    res.status(200).json({msg: `hello ${user?.name} ${randomNum}`})
})
app.post('/refresh_token', (req, res) =>{
    console.log('COOKIE',req.cookies)
    console.log('REQUEST', req)
    const {refreshToken} = req.cookies
    if(!refreshToken) return res.status(401).json({msg: 'log in again sir...'})
    jwt.verify(refreshToken, 'refreshSecret', (err, decoded) =>{
        if(err){
            return res.status(403).json({msg: 'refresh token was fucked with'})
        }
        const newAccessToken = jwt.sign({userId: decoded.userId}, 'secret', {expiresIn: '20s'})
        const newRefreshToken = jwt.sign({userId: decoded.userId}, 'refreshSecret')
        res.cookie('refreshToken', newRefreshToken, {httpOnly: true, domain: ".onrender.com", path: '/refresh_token'})
        res.status(200).json({msg: 'here u go baby',accessToken: newAccessToken})
    })
})

app.listen(port, () => console.log(`serrver is up on port ${port}`))
