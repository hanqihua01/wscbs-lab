const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const crypto = require('crypto');

// const url = require('url');
const validUrl = require('valid-url');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const urls = {};

app.get('/:id', (req, res) => {
    const id = req.params.id;
    if (Object.keys(urls).includes(id)) {
        res.status(301).send(urls[id]);
    } else {
        res.status(404).send('404');
    }
});

app.put('/:id', (req, res) => {
    const id = req.params.id;
    const newUrl = req.body.url;
    if (Object.keys(urls).includes(id)) {
        if (validUrl.isUri(newUrl)) {
            urls[id] = newUrl;
            res.status(200).send('200');
        } else {
            res.status(400).send('error');
        }
    } else {
        res.status(404).send('404');
    }
});

app.delete('/:id', (req, res) => {
    const id = req.params.id;
    if (Object.keys(urls).includes(id)) {
        delete urls[id];
        res.status(204).send('204');
    } else {
        res.status(404).send('404');
    }
});

app.get('/', (req, res) => {
    res.status(200).send(Object.keys(urls));
});

function generateShortUrl(longUrl) {
    let shortUrl;
    do {
        const hashObject = longUrl + Date.now();
        const hash = crypto.createHash('md5').update(hashObject).digest('hex');
        shortUrl = hash.slice(0, 4);
    } while (Object.keys(urls).includes(shortUrl));
    return shortUrl;
}

app.post('/', (req, res) => {
    const newUrl = req.body.url;
    if (Object.values(urls).includes(newUrl)) {
        res.status(201).send(Object.keys(urls).find(key => urls[key] === newUrl));
    } else {
        if (validUrl.isUri(newUrl)) {
            const id = generateShortUrl(newUrl);
            urls[id] = newUrl;
            res.status(201).send(id);
        } else {
            res.status(400).send('error');
        }
    }
});

app.delete('/', (req, res) => {
    res.status(404).send('404');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
