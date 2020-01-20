let express = require('express')

require('dotenv').config()

var port = process.env.PORT
var token = process.env.TOKEN
var trackId = process.env.TRACK

let app = express()

app.listen(port, function () {
	console.log("[-] Running on port : "+port)
})