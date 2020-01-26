const express = require('express');
const router = express.Router();
const request = require('request');
const cheerio = require('cheerio');
const Article = require('../../models/article');
const Note = require('../../models/note');
const axios = require("axios");

router.get('/', function (req, res) {
    Article
        .find({})
        .exec(function (error, docs) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.status(200).json(docs);
            }
        });
});

router.get('/saved', function (req, res) {
    Article
        .find({})
        .where('saved').equals(true)
        .where('deleted').equals(false)
        .populate('notes')
        .exec(function (error, docs) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.status(200).json(docs);
            }
        });
});

router.get('/deleted', function (req, res) {
    Article
        .find({})
        .where('deleted').equals(true)
        .exec(function (error, docs) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.status(200).json(docs);
            }
        });
});

router.post('/save/:id', function (req, res) {
    Article.findByIdAndUpdate(req.params.id, {
        $set: { saved: true }
    },
        { new: true },
        function (error, doc) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.redirect('/');
            }
        });
});

router.delete('/dismiss/:id', function (req, res) {
    Article.findByIdAndUpdate(req.params.id,
        { $set: { deleted: true } },
        { new: true },
        function (error, doc) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.redirect('/');
            }
        });
});

router.delete('/:id', function (req, res) {
    Article.findByIdAndUpdate(req.params.id,
        { $set: { deleted: true } },
        { new: true },
        function (error, doc) {
            if (error) {
                console.log(error);
                res.status(500);
            } else {
                res.redirect('/saved');
            }
        }
    );
});

router.get('/scrape', function (req, res, next) {
    console.log("Entro a scrape");
    axios.get('https://news.ycombinator.com').then(function(response) {
        let $ = cheerio.load(response.data);
        let results = [];
        $('tr.athing td.title').each(function (i,element) {
            let title = $(this).children('a').text();
            let link = $(this).children('a').attr('href');
            let single = {};
            if (link !== undefined && link.includes('http') && title !== '') {
                single = {
                    title: title,
                    link: link
                };
                let entry = new Article(single);
                entry.save(function (err, doc) {
                    if (err) {
                        if (!err.errors.link) {
                            console.log(err);
                        }
                    } else {
                        console.log('new article added');
                    }
                });
            }
        });
        next();
    });
}, function (req, res) {
    res.redirect('/');
});

module.exports = router;
