const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const secretKey = process.env.JWT_SECRET; // 从环境变量中读取密钥

// 注册
app.post('/users', async (req, res) => {
    const data = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(data);

    const { username, password } = req.body;
    if (users[username]) {
        return res.status(409).json({ 'detail': 'duplicate' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = { password: hashedPassword };

    const newData = JSON.stringify(users, null, 2);
    fs.writeFileSync('users.json', newData, 'utf8');

    res.status(201).send('User created');
});

// 更新
app.put('/users', async (req, res) => {
    const data = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(data);

    const { username, 'password': oldPassword, 'new_password': newPassword } = req.body;
    const user = users[username];
    if (user && await bcrypt.compare(oldPassword, user.password)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        users[username].password = hashedPassword;

        const newData = JSON.stringify(users, null, 2);
        fs.writeFileSync('users.json', newData, 'utf8');

        res.status(200).send('Password updated');
    } else {
        res.status(403).json({ 'detail': 'forbidden' });
    }
});

// 登录
app.post('/users/login', async (req, res) => {
    const data = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(data);

    const { username, password } = req.body;
    const user = users[username];
    if (user && await bcrypt.compare(password, user.password)) {
        const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });

        const expDurationSeconds = 60 * 60; // 1 hour
        const payload = JSON.stringify({
            username: username,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + expDurationSeconds
        });

        const encodedHeader = Buffer.from(header).toString('base64url');
        const encodedPayload = Buffer.from(payload).toString('base64url');

        const signatureBase = `${encodedHeader}.${encodedPayload}`;
        const signature = crypto.createHmac('sha256', secretKey).update(signatureBase).digest('base64url');

        const token = `${encodedHeader}.${encodedPayload}.${signature}`;
        res.status(200).json({ token });
    } else {
        res.status(403).json({ 'detail': 'forbidden' });
    }
});

// 验证
app.post('/users/authenticate', (req, res) => {
    const data = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(data);

    const token = req.body.token;
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return res.sendStatus(401);

    const encodedHeader = tokenParts[0];
    const encodedPayload = tokenParts[1];
    const receivedSignatureEncoded = tokenParts[2];

    try {
        const signatureBase = `${encodedHeader}.${encodedPayload}`;
        const expectedSignature = crypto.createHmac('sha256', secretKey)
            .update(signatureBase)
            .digest('base64url');
    
        if (receivedSignatureEncoded !== expectedSignature) return res.sendStatus(403);
    
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString('ascii'));
    
        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTimeInSeconds) {
            return res.status(403).json({ 'detail': 'forbidden' });
        }
    
        res.status(200).json({ username: payload.username });
    } catch (error) {
        return res.sendStatus(403);
    }
    
});

app.listen(8001, () => {
    console.log('Server is running on port 8001');
});