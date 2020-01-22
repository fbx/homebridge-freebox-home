module.exports.sensorStatus = function(object) {
	if(object) {
		if(object.success == true) {
			if(object.result.value == true) {
				// a true value means everyting is normal
				return 0
			} else {
				return 1
			}
		}
	}
}