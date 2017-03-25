var Eris = require("eris");
var fs = require("fs");
var webshot = require("webshot");
var request = require("request");
var stream = require('stream');

var url = /^(ftp|http|https):\/\/[^ "]+$/;
var url_regex = new RegExp(url);

var bot = new Eris.CommandClient(JSON.parse(fs.readFileSync('config.json')).token, {}, {
	description: "A bot that takes screenshots of websites.",
	owner: "averysumner",
	prefix: "w$",
	defaultHelpCommand : false
});

var helpCommand = bot.registerCommand("help", (msg, args) => {
	var content = {
		content: "",
		embed: {
			title: "Web Shot Bot",
			type: "rich",
			description: "I am `Web Shot Bot`, a very simple bot. All I do is take screenshots of websites.",
			fields: [{name: "Commands", value: "`w$help` - This help command.\n`w$invite` - Returns an OAuth2 bot invite URL for inviting me to your guild.\n`w$webshot <URL>` or `w$ws <URL>` - Takes a screenshot of the specified URL. (URL must begin with `http://` or `https://`)"}],
			color: 65280,
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
			description: "Invite me to your server with this link: https://discordapp.com/oauth2/authorize?client_id=234895303759757312&scope=bot&permissions=0",
			color: 65280,
			thumbnail: {url: "https://cdn.discordapp.com/avatars/234895303759757312/2e7016a63bbb8b18caffcea9f9ab54bb.webp?size=256"},
		}
	}
	return content
});

var webshotCommand = bot.registerCommand("webshot", (msg, args) => {
	//Catches invalid arguments
	if (args.length === 0 || !url_regex.test(args[0])) {
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
		var cleaned = '<base href="http://' + args[0].split("/")[2] + '">' + body.replace("98.203.233.130", "noip4u"); //Adds a base so CSS loads, and censors my IP address
		var image = '';
		var renderStream = webshot(cleaned, null, {
			siteType: 'html'
		}); //Streams webshot so you don't have to save it to disk
		renderStream.on('data', function(data) {
			image += data.toString('binary');
		});
		renderStream.on('end', function() {
			image = new Buffer(image, "binary"); //Convert to buffer so Eris can use it.
			bot.createMessage(msg.channel.id, "Here's your webshot of `" + args[0] + "`", {
				file: image,
				name: 'webshot.png'
			})
		});
	});
}, {
	description: "Take a screenshot of any website.",
	fullDescription: "The bot will send a message containing a screenshot of the specified url.",
	usage: "<url>"
});

bot.registerCommandAlias('ws', 'webshot');
bot.registerCommandAlias('screenshot', 'webshot');
bot.registerCommandAlias('ss', 'webshot');

bot.connect();
