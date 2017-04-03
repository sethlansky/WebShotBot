var express = require('express')
var app = express()
module.exports = {
    startWebServer: function(bot) {
        app.listen(80)
        app.get('/api/guilds', function(req, res){
            res.send({guilds : bot.guilds.size})
        })
        app.get('/', function(req, res){
            res.sendFile(__dirname + '/html/index.html')
        })
    }
}