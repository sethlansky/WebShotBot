var Eris = require("eris")
var fs = require("fs")
var webshot = require("webshot")
var request = require("request")
var stream = require('stream')
var web = require('./web')

var urlRegex = new RegExp(/^(ftp|http|https):\/\/[^ "]+$/)
var config = JSON.parse(fs.readFileSync('config.json'))
var ipRegex = new RegExp(config.ipRegex, "g")

var bot = new Eris.CommandClient(JSON.parse(fs.readFileSync('config.json')).token, {}, {
	prefix: "w$",
	defaultHelpCommand : false
})

function parseFlags(msg, flags, cb) {
	var flagValues = {}
	flags.forEach(function(flag){
		if (msg.content.indexOf('--' + flag) > -1) {
			flagValues[flag] = msg.content.substring(msg.content.indexOf(flag), msg.content.length).split(' ')[1]
		} else {
			flagValues[flag] = 0
		}
	})
	return cb(flagValues)
}

function updateStats(bot) {
  bot.editStatus("online", {name : "w$help - " + bot.guilds.size + " guilds"})
  request({method : "POST", url : "https://bots.discord.pw/api/bots/" + bot.user.id + "/stats", headers : {"Authorization" : config.discordBotsToken}, json : {server_count : bot.guilds.size}})
  request({method : "POST", url : "https://bots.discordlist.net/api/", json : {token : config.discordListToken, servers : bot.guilds.size}})
}

bot.on("ready", function(){
  updateStats(bot)
})

bot.on("guildCreate", function(){
  updateStats(bot)
})

bot.on("guildLeave", function(){
  updateStats(bot)
})

var helpCommand = bot.registerCommand("help", (msg, args) => {
	var content = {
		content: "",
		embed: {
			title: "Web Shot Bot",
			type: "rich",
			description: "I am `Web Shot Bot`, a very simple bot. All I do is take screenshots of websites. I am currently in `" + bot.guilds.size + '` guilds!',
			fields: [{name: "Commands", value: "`w$help` - This help command.\n`w$invite` - Returns an OAuth2 bot invite URL for inviting me to your guild.\n`w$webshot <URL>` or `w$ws <URL>` - Takes a screenshot of the specified URL. (URL must begin with `http://` or `https://`)"}, {name: 'Flags', value: 'The `w$webshot` command can take `flags`, such as `--renderDelay <delay>`. This command would return an image of the website `https://google.com` five seconds after it has loaded: `w$webshot https://google.com --renderDelay 5`.'}],
			color: 3901635,
			thumbnail: {url: "https://cdn.discordapp.com/avatars/234895303759757312/8d7fa53fcf3a50df10feb08da75b1e06.webp?size=256"},
			author: {name: "Click Here To Invite Me To Your Server", url: "https://discordapp.com/oauth2/authorize?client_id=234895303759757312&scope=bot&permissions=104193089"}
		}
	}
	return content
});

var inviteCommand = bot.registerCommand("invite", (msg, args) => {
	var content = {
		content: "",
		embed: {
			title: "Invite",
			type: "rich",
			description: "Invite me to your server with this link: https://discordapp.com/oauth2/authorize?client_id=234895303759757312&scope=bot&permissions=104193089",
			color: 3901635,
			thumbnail: {url: "https://cdn.discordapp.com/avatars/234895303759757312/8d7fa53fcf3a50df10feb08da75b1e06.webp?size=256"},
		}
	}
	return content
})

var webshotCommand = bot.registerCommand("webshot", (msg, args) => {
	//Catches invalid arguments
	if (args.length === 0 || !urlRegex.test(args[0])) {
		var content = {
			content: "",
			embed: {
				title: "ERROR",
				type: "rich",
				description: "One or more of the arguments passed was invalid, please try again.",
				color: 16711680
			}
		}
		return content
	}
	parseFlags(msg, ["renderDelay"], function(flags){
		console.log(msg.author.username + ': ' + args[0] + ' with a render delay of ' + flags.renderDelay)
		//Requests page itself, instead of letting webshot do it, for the purpose of IP censoring
		request(args[0], function(err, resp, body) {
			try{
				var cleaned = '<base href="http://' + args[0].split("/")[2] + '">' + body.replace(ipRegex, "noip4u"); //Adds a base so CSS loads, and censors my IP address
				var image = '';
				var renderStream = webshot(cleaned, null, {
					siteType: 'html',
					renderDelay: flags.renderDelay*1000
				}) //Streams webshot so you don't have to save it to disk
				renderStream.on('data', function(data) {
					image += data.toString('binary')
				})
				renderStream.on('end', function() {
					image = new Buffer(image, "binary"); //Convert to buffer so Eris can use it.
					bot.createMessage(msg.channel.id, "Here's your webshot of `" + args[0] + "`", {
						file: image,
						name: 'webshot.png'
					})
				})
			} catch (err) {
				var content = {
					content: "",
					embed: {
						title: "ERROR",
						type: "rich",
						description: "The specified website does not exist or returns an empty page.",
						color: 16711680
					}
				}
				bot.createMessage(msg.channel.id, content)
			}
		})
	})
})

bot.registerCommandAlias('ws', 'webshot')

bot.connect()
web.startWebServer(bot)
