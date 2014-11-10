var _ = require('lodash');
var async = require('async');
var deck = require('deck');
var Entities = require('html-entities').XmlEntities;
var fs = require('fs');
var Twit = require('twit');

var entities = new Entities();

var bots;
var fields;
var templates;

var twitter = new Twit({
    consumer_key: process.env.SUMMITKEY,
    consumer_secret: process.env.SUMMITSECRET,
    access_token: process.env.SUMMITACCESS,
    access_token_secret: process.env.SUMMITACCESSSECRET
});

function postTweet() {
    var botDeck = deck.shuffle(bots);
    var fieldDeck = deck.shuffle(fields);
    var templateDeck = deck.shuffle(templates);

    var template = templateDeck.pop();
    template = template.replace(/%field%/g, function(match) {
        return fieldDeck.pop();
    });
    template = template.replace(/%bot%/g, function(match) {
        return '@' + botDeck.pop();
    });

    template = entities.decode(template);

    twitter.post('statuses/update', { status: template }, function(err) { if(err) console.log(err); });
}

function getFields(callback) {
    fs.readFile('fieldsOfStudy.json', function(err, data) {
        fields = _.filter(_.pluck(JSON.parse(data).result, 'name'));
        callback();
    });
}

function getTemplates(callback) {
    fs.readFile('templates', function(err, data) {
        templates = _.filter(data.toString().split('\n'));
        callback();
    });
}

function getUsernames(callback) {
    twitter.get('lists/members', { count: 5000, list_id: 120837264 }, function(err, data, response) {
        bots = _.pluck(data.users, 'screen_name');
        if (typeof callback === 'function') {
            callback();
        }
    });
}

async.parallel([
    getFields,
    getTemplates,
    getUsernames
], function(err) {
    postTweet();
    setInterval(getUsernames, 24 * 60 * 60 * 1000);
    setInterval(postTweet, 2 * 60 * 60 * 1000);
});
