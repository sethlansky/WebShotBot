var Eris = require("eris")
var fs = require("fs")
var webshot = require("webshot")
var request = require("request")
var stream = require('stream')

var urlRegex = new RegExp(/^(ftp|http|https):\/\/[^ "]+$/)
var config = JSON.parse(fs.readFileSync('config.json'))
var ipRegex = new RegExp(config.ipRegex, "g")

var bot = new Eris.CommandClient(JSON.parse(fs.readFileSync('config.json')).token, {}, {
	prefix: "w$",
	defaultHelpCommand : false
});

function updateStats(bot) {
  bot.editStatus("online", {name : "w$help - " + bot.guilds.size + " servers"})
  request({method : "POST", url : "https://bots.discord.pw/api/bots/" + bot.user.id + "/stats", headers : {"Authorization" : config.discordBotsToken}, json : {server_count : bot.guilds.size}})
  request({method : "POST", url : "https://bots.discordlist.net/api/", json : {token : config.discordListToken, servers : bot.guilds.size}})
}

bot.on("ready", function(){
  updateStats(bot)
});

bot.on("guildCreate", function(){
  updateStats(bot)
});

bot.on("guildLeave", function(){
  updateStats(bot)
});

var helpCommand = bot.registerCommand("help", (msg, args) => {
	var content = {
		content: "",
		embed: {
			title: "Web Shot Bot",
			type: "rich",
			description: "I am `Web Shot Bot`, a very simple bot. All I do is take screenshots of websites. I am currently in `" + bot.guilds.size + '` guilds!',
			fields: [{name: "Commands", value: "`w$help` - This help command.\n`w$invite` - Returns an OAuth2 bot invite URL for inviting me to your guild.\n`w$webshot <URL>` or `w$ws <URL>` - Takes a screenshot of the specified URL. (URL must begin with `http://` or `https://`)"}],
			color: 3901635,
			thumbnail: {url: "https://cdn.discordapp.com/avatars/234895303759757312/2e7016a63bbb8b18caffcea9f9ab54bb.webp?size=256"},
			author: {name: "averysumner", url: "http://averysumner.net", icon_url: "https://cdn.discordapp.com/avatars/101475937589166080/2ebfd085d14e8446d8ae618d9382651c.webp?size=256"}
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
			thumbnail: {url: "https://cdn.discordapp.com/avatars/234895303759757312/2e7016a63bbb8b18caffcea9f9ab54bb.webp?size=256"},
		}
	}
	return content
});

var webshotCommand = bot.registerCommand("webshot", (msg, args) => {
	console.log(msg.author.username + ': ' + args[0])
	//Catches invalid arguments
	if (args.length === 0 || !urlRegex.test(args[0])) {
		var content = {
			content: "",
			embed: {
				title: "INVALID ARGUMENT",
				type: "rich",
				description: "The `URL` argument of your command was invalid. Please try again.",
				color: 16711680
			}
		}
		return content
	}
	//Requests page itself, instead of letting webshot do it, for the purpose of IP censoring
	request(args[0], function(err, resp, body) {
		if (body == undefined) {
			var content = {
				content: "",
				embed: {
					title: "SITE TOOK TOO LONG TO RESPOND",
					type: "rich",
					description: "The website `" + args[0] + "` took too long to respond.",
					color: 16711680
				}
			}
			return content
		}
		var cleaned = '<base href="http://' + args[0].split("/")[2] + '">' + body.replace(ipRegex, "noip4u"); //Adds a base so CSS loads, and censors my IP address
		var image = '';
		var renderStream = webshot(cleaned, null, {
			siteType: 'html'
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
	})
})

bot.registerCommandAlias('ws', 'webshot');

bot.connect();
