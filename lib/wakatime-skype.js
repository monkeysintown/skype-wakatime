const API_URL = 'https://wakatime.com/api/v1/actions';
const PLUGIN = 'skype-wakatime/' + require('../package.json').version;

var https = require('https');
var fs = require('fs');
var ini = require('ini');
var sqlite3 = require('sqlite3').verbose();
var btoa = require('btoa');

// command line parameters
var DB = './tmp/main.db'; // TODO: pass this via parameter or list all profiles and ask on startup
var MIN_TIME = 120000;

var db;
var homedir = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
var wakafile = homedir + '/.wakatime.cfg';
var config = ini.parse(fs.readFileSync(wakafile, 'utf-8'));

function sendHeartbeat(file, time, project, language, isWrite, lines) {
    var request = require('request');

    var data = JSON.stringify({
        time: time,
        file: file,
        project: project,
        language: language,
        is_write: isWrite ? true : false,
        lines: lines,
        plugin: PLUGIN
    });

    request({
            method: 'POST',
            uri: API_URL,
            mimeType: 'application/json',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(config.settings.api_key)
            },
            body: data
        }, function (error, response, body) {
            if(response.statusCode == 201) {
                console.log("body: " + body);
            } else {
                console.log('error: '+ response.statusCode)
                console.log(body)
            }
        }
    );
}

function open() {
    console.log('Check Skype calls...');
    db = new sqlite3.Database(DB, query);
}

function query() {
    var lastCheck = (Date.now()-MIN_TIME)/1000; // epoch

    db.all('SELECT ca.begin_timestamp, ca.duration, co.extprop_tags, ca.topic, cm.identity FROM Calls ca, CallMembers cm, Contacts co WHERE co.skypename = cm.identity AND ca.name = cm.call_name AND ca.duration IS NOT NULL AND ca.is_active =0 AND ca.begin_timestamp+ca.duration > ' + lastCheck + ' ORDER BY begin_timestamp DESC', function(err, rows) {
        if(rows && rows.length>0) {
            rows.forEach(function (row) {
                // QUESTION: do I have to place 2 calls here to have a time period (start and end call)?
                sendHeartbeat(
                    row.topic ? row.topic : row.identity,
                    row.begin_timestamp,
                    row.extprop_tags ? row.extprop_tags : 'Skype',
                    'Call',
                    true,
                    1
                );
                sendHeartbeat(
                    row.topic ? row.topic : row.identity,
                    row.begin_timestamp + row.duration,
                    row.extprop_tags ? row.extprop_tags : 'Skype',
                    'Call',
                    true,
                    1
                );
            });
        } else {
            console.log('No changes.');
        }

        close();
    });

    // TODO: do same for chats...
}

function close() {
    db.close();
}

function help() {
    console.log(' ');
    console.log('Please pass at least the path to your Skype DB. Second parameter is optional (interval between checks). Example:');
    console.log('node lib/wakatime-skype.js ~/.Skype/[skypename]/main.db ');
    console.log(' ');
}

function main() {
    var args = process.argv.slice(2);

    if(args.length === 0){
        help();
    } else {
        DB = args[0];
        MIN_TIME = args.length > 1 ? args[1] : 120000;

        open();
        setInterval(open, MIN_TIME);
    }
}

main();

exports.wakatimeSkype = main;