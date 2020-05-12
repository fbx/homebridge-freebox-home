let express = require('express')
let Routes = require('./routes/Routes')
let environment = require('./freeboxOS/Credentials')

require('better-logging')(console, {
	format: ctx => `${ctx.time24 + ctx.date} ${ctx.msg}`
})

process.title = "homebridge-freebox-home"

const port = 8888

let app = express()
let routes = new Routes()
let autoAuth = checkAutoAuth(process.argv)
let envFileCreated = environment.checkCredentialsFile()

let server = app.listen(port, function () {
	routes.init(port)
	if (autoAuth || !envFileCreated) {
		// Env file is already present (hasn't been just created) or auto auth mode
		routes.startFreeboxAuthentication((success) => {
			if (success) {
				app.use('/api', routes.router)
				routes.startPollingNodes()
			} else {
				server.close()
			}
		})
	} else {
		app.use('/api', routes.router)
	}
})

function checkAutoAuth(args) {
	for (arg of args) {
		if (arg == 'auto-auth') {
			return true
		}
	}
	return false
}