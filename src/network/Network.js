let request = require('request')

module.exports = function() {
    this.request = function(method, url, headers, body, callback) {
        const options = {
            url: url,
            method: method,
            headers: headers,
            json: true,
            body: body
        }
    
        request(options, function(err, response, body) {
            if(response == null) {
                console.log(err)
                callback(null, null)
            } else {
                callback(response.statusCode, response.body)
            }
        })
    }
}