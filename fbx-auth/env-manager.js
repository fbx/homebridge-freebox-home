const fs = require('fs') 
const envfile = require('envfile')
const sourcePath = '.env'

function update(token, track, callback) {
	updateToken(token, () => {
		updateTrackId(track, () => {
			callback(true)
		})
 	})
}

function updateToken(value, callback) {
	let parsedFile = envfile.parseFileSync('.env')
	parsedFile.TOKEN = value
	fs.writeFile('./.env', envfile.stringifySync(parsedFile), (err) => {
		console.log("[-] current token    : "+value)
		callback((err == null), err)
	})
}

function updateTrackId(value, callback) {
	let parsedFile = envfile.parseFileSync('.env')
	parsedFile.TRACK = value
	fs.writeFile('./.env', envfile.stringifySync(parsedFile), (err) => {
		console.log("[-] current track id : "+value)
		callback((err == null), err)
	})
}

module.exports.update = update