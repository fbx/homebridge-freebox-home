module.exports.mainAlarmRequestId = function(alarm) {
	if(alarm) {
		var id = 0
		for(endpoint of alarm.type.endpoints) {
			if(endpoint.name == 'alarm1') {
				return id
			} else {
				id++
			}
		}
	}
}

module.exports.secondaryAlarmRequestId = function(alarm) {
	if(alarm) {
		var id = 0
		for(endpoint of alarm.type.endpoints) {
			if(endpoint.name == 'alarm2') {
				return id
			} else {
				id++
			}
		}
	}
}

module.exports.alarmOffId = function(alarm) {
	if(alarm) {
		var id = 0
		for(endpoint of alarm.type.endpoints) {
			if(endpoint.name == 'off') {
				return id
			} else {
				id++
			}
		}
	}
}

module.exports.alarmStateId = function(alarm) {
	if(alarm) {
		var id = 0
		for(endpoint of alarm.type.endpoints) {
			if(endpoint.name == 'state') {
				return id
			} else {
				id++
			}
		}
	}
}