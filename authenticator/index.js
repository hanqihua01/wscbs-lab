const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const secretKey = process.env.JWT_SECRET; // 从环境变量中读取密钥
const users = {}; // 存储用户信息

// 注册
app.post('/users', async (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.status(409).send('Username duplicated');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = { password: hashedPassword };
    res.status(201).send('User created');
});

// 更新
app.put('/users', async (req, res) => {
    const { username, 'old-password': oldPassword, 'new-password': newPassword } = req.body;
    console.log(username, oldPassword, newPassword)
    const user = users[username];
    if (user && await bcrypt.compare(oldPassword, user.password)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        users[username].password = hashedPassword;
        res.status(200).send('Password updated');
    } else {
        res.status(403).send('Forbidden');
    }
});

// 登录
app.post('/users/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (user && await bcrypt.compare(password, user.password)) {
        const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
        const payload = JSON.stringify({ username: username, iat: Math.floor(Date.now() / 1000) });

        const encodedHeader = Buffer.from(header).toString('base64url');
        const encodedPayload = Buffer.from(payload).toString('base64url');

        const signatureBase = `${encodedHeader}.${encodedPayload}`;
        const signature = crypto.createHmac('sha256', secretKey).update(signatureBase).digest('base64url');

        const token = `${encodedHeader}.${encodedPayload}.${signature}`;
        res.status(200).json({ token });
    } else {
        res.status(403).send('Forbidden');
    }
});

// // JWT认证中间件
// function authenticateToken(req, res, next) {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) return res.sendStatus(401);

//     const token = authHeader.split(' ')[1];
//     const tokenParts = token.split('.');
//     if (tokenParts.length !== 3) return res.sendStatus(401); // JWT must consist of three parts

//     const encodedHeader = tokenParts[0];
//     const encodedPayload = tokenParts[1];
//     const receivedSignatureEncoded = tokenParts[2];

//     try {
//         const signatureBase = `${encodedHeader}.${encodedPayload}`;
//         const expectedSignature = crypto.createHmac('sha256', secretKey)
//             .update(signatureBase)
//             .digest('base64url'); // Convert to base64url format for comparison

//         if (receivedSignatureEncoded !== expectedSignature) return res.sendStatus(403); // Signature mismatch

//         req.user = JSON.parse(Buffer.from(encodedPayload, 'base64').toString('ascii')); // Decode payload
//         next();
//     } catch (error) {
//         return res.sendStatus(403); // Error handling, e.g., payload decoding errors
//     }
// }

// // 创建URL映射端点，需要认证
// app.post('/', authenticateToken, (req, res) => {
//     const newUrl = req.body.value;
//     if (isValidURL(newUrl)) {
//         const id = generateShortUrl(newUrl);
//         urls[id] = { url: newUrl, username: req.user.username };
//         res.status(201).json({ id: id, value: urls[id].url });
//     } else {
//         res.status(400).send('URL not valid');
//     }
// });

// // 获取URL映射端点
// app.get('/:id', authenticateToken, (req, res) => {
//     const id = req.params.id;
//     if (urls[id] && urls[id].username === req.user.username) {
//         res.status(301).json({ id: id, value: urls[id].url });
//     } else {
//         res.status(404).send('ID not found or access denied');
//     }
// });

// // 更新URL映射端点
// app.put('/:id', authenticateToken, (req, res) => {
//     const id = req.params.id;
//     const newUrl = req.body.url;
//     if (urls[id] && urls[id].username === req.user.username && isValidURL(newUrl)) {
//         urls[id].url = newUrl;
//         res.status(200).json({ id: id, value: urls[id].url });
//     } else {
//         res.status(404).send('ID not found or access denied');
//     }
// });

// // 删除URL映射端点
// app.delete('/:id', authenticateToken, (req, res) => {
//     const id = req.params.id;
//     if (urls[id] && urls[id].username === req.user.username) {
//         delete urls[id];
//         res.status(204).send('DELETE successful');
//     } else {
//         res.status(404).send('ID not found or access denied');
//     }
// });

app.listen(9000, () => {
    console.log('Server is running on port 9000');
});