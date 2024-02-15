const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const crypto = require('crypto');

app.use(bodyParser.json({
    type(req) {
        return true;
    }
}));
app.use(bodyParser.urlencoded({ extended: true }));

const urls = {};

app.get('/:id', (req, res) => {
    const id = req.params.id;
    if (Object.keys(urls).includes(id)) {
        res.status(301).json({ id: id, value: urls[id] });
    } else {
        res.status(404).send('ID not found');
    }
});

app.put('/:id', (req, res) => {
    const id = req.params.id;
    const newUrl = req.body.url;
    if (Object.keys(urls).includes(id)) {
        if (isValidURL(newUrl)) {
            urls[id] = newUrl;
            res.status(200).json({ id: id, value: urls[id] });
        } else {
            res.status(400).send('URL not valid');
        }
    } else {
        res.status(404).send('ID not found');
    }
});

app.delete('/:id', (req, res) => {
    const id = req.params.id;
    if (Object.keys(urls).includes(id)) {
        delete urls[id];
        res.status(204).send('DELETE successfull');
    } else {
        res.status(404).send('ID not found');
    }
});

app.get('/', (req, res) => {
    const ids = [];
    const values = [];
    for (const key in urls) {
        ids.push(key);
        values.push(urls[key]);
    }
    if (ids.length !== 0) {
        res.status(200).json({ id: ids, value: values });
    } else {
        res.status(404).json({ id: undefined, value: undefined });
    }
});

app.post('/', (req, res) => {
    const newUrl = req.body.value;
    if (Object.values(urls).includes(newUrl)) {
        const id = Object.keys(urls).find(key => urls[key] === newUrl);
        res.status(201).json({ id: id, value: urls[id] });
    } else {
        if (isValidURL(newUrl)) {
            const id = generateShortUrl(newUrl);
            urls[id] = newUrl;
            res.status(201).json({ id: id, value: urls[id] });
        } else {
            res.status(400).send('URL not valid');
        }
    }
});

app.delete('/', (req, res) => {
    for (const key in urls) {
        delete urls[key];
    }
    res.status(404).send('404');
});

function isValidURL(url) {
    var urlPattern = new RegExp(
        "^https?:\/\/" +
        "(?:" + // 开始非捕获组
            "(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,6}\\.?" +
            "|" +
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
