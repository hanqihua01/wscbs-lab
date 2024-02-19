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

app.get('/:id', (req, res) => {
});

app.put('/:id', (req, res) => {
});

app.delete('/:id', (req, res) => {
});

app.get('/', (req, res) => {
});

app.post('/', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).send('Forbidden');

    axios.post('http://localhost:9000/users/authenticate', { token })
        .then(response => {
            const user = response.data.username;
            const newUrl = req.body.url;
            if (Object.values(urls).includes(user)) {
                // 判断该用户是否已经存在该 URL
                const userUrls = urls[user];
                for (const url of userUrls) {
                    if (url.url === newUrl) {
                        return res.status(201).json({ id: url.shortUrl });
                    }
                }
                console.log('newUrl', newUrl);
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
        })
        .catch(error => {
            res.status(403).send('Forbidden');
        });
});

app.delete('/', (req, res) => {
    for (const key in urls) {
        delete urls[key];
    }
    res.status(404).send('404');
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
