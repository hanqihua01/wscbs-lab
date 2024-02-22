const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

app.use(bodyParser.json({
    type(req) {
        return true;
    }
}));
app.use(bodyParser.urlencoded({ extended: true }));

const urls = {};

const authenticateMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send('Forbidden');

    axios.post('http://localhost:8001/users/authenticate', { token })
        .then(response => {
            req.body.user = response.data.username;
            next();
        })
        .catch(error => {
            res.status(403).send('Forbidden');
        });
}

// urls = {
//     'user1': [
//         {
//             'url': 'https://www.google.com',
//             'shortUrl': 'go'
//         },
//         {
//             'url': 'https://www.baidu.com',
//             'shortUrl': 'bd'
//         }
//     ],
//     'user2': [
//         {
//             'url': 'https://www.bing.com',
//             'shortUrl': 'bi'
//         },
//         {
//             'url': 'https://www.yahoo.com',
//             'shortUrl': 'yh'
//         }
//     ]
// }

app.get('/:id', authenticateMiddleware, (req, res) => {
    const user = req.body.user;
    const shortUrl = req.params.id;
    if (Object.keys(urls).includes(user)) {
        for (const url of urls[user]) {
            if (url.shortUrl === shortUrl) {
                return res.status(301).json({ value: url.url });
            }
        }
    }
    return res.status(404).send('Not found');
});

app.put('/:id', authenticateMiddleware, (req, res) => {
    const user = req.body.user;
    const shortUrl = req.params.id;
    const newUrl = req.body.url;
    if (Object.keys(urls).includes(user)) {
        for (const url of urls[user]) {
            if (url.shortUrl === shortUrl) {
                if (!isValidURL(newUrl)) {
                    return res.status(400).send('URL not valid');
                } else {
                    url.url = newUrl;
                    return res.status(200).send('Updated');
                }
            }
        }
    }
    return res.status(404).send('Not found');
});

app.delete('/:id', authenticateMiddleware, (req, res) => {
    const user = req.body.user;
    const shortUrl = req.params.id;
    if (Object.keys(urls).includes(user)) {
        for (let i = 0; i < urls[user].length; i++) {
            if (urls[user][i].shortUrl === shortUrl) {
                urls[user].splice(i, 1);
                return res.status(204).send('Deleted');
            }
        }
    }
    return res.status(404).send('Not found');
});

app.get('/', authenticateMiddleware, (req, res) => {
    const user = req.body.user;
    if (Object.keys(urls).includes(user)) {
        if (urls[user].length === 0) {
            return res.status(200).json({});
        } else {
            return res.status(200).json(urls[user]);
        }
    } else {
        return res.status(200).json({});
    }
});

app.post('/', authenticateMiddleware, (req, res) => {
    const user = req.body.user;
    const newUrl = req.body.value;
    if (Object.keys(urls).includes(user)) {
        // 判断该用户是否已经存在该 URL
        const userUrls = urls[user];
        for (const url of userUrls) {
            if (url.url === newUrl) {
                return res.status(201).json({ id: url.shortUrl });
            }
        }
        if (!isValidURL(newUrl)) {
            return res.status(400).send('URL not valid');
        } else {
            const shortUrl = generateShortUrl(newUrl);
            urls[user].push({ url: newUrl, shortUrl });
            return res.status(201).json({ id: shortUrl });
        }
    } else {
        if (!isValidURL(newUrl)) {
            return res.status(400).send('URL not valid');
        } else {
            const shortUrl = generateShortUrl(newUrl);
            urls[user] = [{ url: newUrl, shortUrl }];
            return res.status(201).json({ id: shortUrl });
        }
    }
});

app.delete('/', authenticateMiddleware, (req, res) => {
    const user = req.body.user;
    urls[user] = [];
    return res.status(404).send('Deleted all URLs for the user');
});

function isValidURL(url) {
    var urlPattern = new RegExp(
        "^https?:\/\/" + // 匹配以 http:// 或 https:// 开头
        "(?:" + // 开始非捕获组
        "(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,6}\\.?" + // 匹配域名
        "|" + // 或
        "localhost" + // 匹配 localhost
        "|" + // 或
        "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}" + // 匹配 IPv4 地址
        ")" + // 结束非捕获组
        "(?::\\d+)?" + // 匹配可选的端口号
        "(?:/?|[/?]\\S+)$" // 匹配可选的路径或查询字符串
    );

    return urlPattern.test(url);
}

function generateShortUrl(longUrl) {
    let shortUrl;
    do {
        const hashObject = longUrl + Date.now();
        const hash = crypto.createHash('md5').update(hashObject).digest('hex');
        shortUrl = hash.slice(0, 2);
    } while (Object.keys(urls).includes(shortUrl));
    return shortUrl;
}

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});
