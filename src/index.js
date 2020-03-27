let express = require('express')
let Routes = require('./routes/Routes')
let environment = require('./freeboxOS/Credentials')

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