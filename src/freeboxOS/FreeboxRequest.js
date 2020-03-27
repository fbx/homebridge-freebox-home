let request = require('request')

module.exports = function() {
    this.RETRY_TIMEOUT = 2000 // 2 seconds
    this.RETRY_COUNT = 0

    this.FreeboxSession = require('./FreeboxSession')

    this.credentials = {
        challenge: null,
	    session: null,
	    trackId: null,
	    token: null
    }

    this.freeboxAuth = function(token, trackId, callback) {
        this.FreeboxSession.fbx(token, trackId, (token, sessionToken, trackId, challenge) => {
            this.authCallback(token, sessionToken, trackId, challenge)
            callback(token, sessionToken, trackId, challenge)
        })
    }

    this.authCallback = function(token, sessionToken, trackId, challenge) {
        if (token == null) {
            console.log('[!] Trying updating with null credentials')
            return
        }
        this.credentials.session = sessionToken
        this.credentials.challenge = challenge
        this.credentials.token = token
        this.credentials.trackId = trackId
        console.log('[i] Updated credentials')
    }

    this.request = function(method, url, body, callback, autoRetry) {
        if (this.credentials.token == null) {
            console.log('[!] Operation requested with null token')
            callback(null, null)
            return
        }
        const options = {
            url: url,
            method: method,
            headers: {
                'X-Fbx-App-Auth': this.credentials.session
            },
            json: true,
            body: body
        }
        var self = this
        request(options, function(err, response, body) {
            if(response == null) {
                console.log(err)
                callback(null, null)
                return
            }
            // if the challenge has changed -> request new session token
            // returns the new auth stuff and retry the request
            if ((body.error_code != null && body.error_code == 'auth_required') && self.credentials.challenge != body.result.challenge) {
                console.log('[i] Fbx authed operation requested without credentials')
                self.FreeboxSession.session(self.credentials.token, body.result.challenge, (new_sessionToken) => {
                    if(new_sessionToken == null) {
                        if (autoRetry) {
                            console.log('[!] Freebox OS returned a null sessionToken. Trying again...')
                            setTimeout(function() {
                                self.request(method, url, body, callback, autoRetry)
                            }, self.RETRY_TIMEOUT)
                            return
                        } else {
                            console.log('[!] Freebox OS returned null sessionToken.')
                            callback(401, null)
                            return
                        }
                    }
                    self.authCallback(self.credentials.token, new_sessionToken, self.credentials.trackId, body.result.challenge)
                    self.request(method, url, body, callback, autoRetry)
                })
            } else {
                if(body.error_code != null && body.error_code == 'insufficient_rights') {
                    if (autoRetry) {
                        console.log('[!] Insufficient rights to request home api ('+body.missing_right+'). Trying again...')
                        setTimeout(function() {
                            self.request(method, url, body, callback, autoRetry)
                        }, self.RETRY_TIMEOUT)
                    } else {
                        console.log('[!] Insufficient rights to request home api.')
                        callback(401, null)
                    }
                } else if(body.success == false) {
                    setTimeout(function() {
                        if(self.RETRY_COUNT < 3) {
                            self.request(method, url, body, callback, autoRetry)
                            self.RETRY_COUNT++
                        } else {
                            callback(401, null)
                            self.RETRY_COUNT = 0
                            return
                        }
                    }, self.RETRY_TIMEOUT)
                } else {
                    callback(response.statusCode, body)
                }
            }
        })
    }
}