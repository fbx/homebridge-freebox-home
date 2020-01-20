let router = require('express').Router()

require('dotenv').config()

// List all nodes
router.get('/node/list/', function(req, res) {
	res.status(200)
	res.json({})
})

// Get the status of a given node (by id)
router.get('/node/:id', function(req, res) {
	res.status(200)
	res.json({})
})

// Get all the contact sensors ids
router.get('node/contactSensor', function(req, res) {
	res.status(200)
	res.json({})
})

// Get all the motion sensors ids
router.get('node/motionSensor', function(req, res) {
	res.status(200)
	res.json({})
})

// Activate the main alarm
router.post('/alarm/main', function(req, res) {
	res.status(200)
	res.json({})
})

// Activate the secondary alarm
router.post('/alarm/secondary', function(req, res) {
	res.status(200)
	res.json({})
})

// Dectivate all alarms
router.post('/alarm/off', function(req, res) {
	res.status(200)
	res.json({})
})

// Get the state of the alarm
router.post('/alarm/state', function(req, res) {
	res.status(200)
	res.json({})
})

// Get the target state of the alarm
router.post('/alarm/target', function(req, res) {
	res.status(200)
	res.json({})
})

// To notify the controller with new auth data
function updateAuth(new_session, new_challenge) {
	// TODO :
	//controller.updateAuth(new_session, new_challenge)
}

module.exports.router = router
module.exports.updateAuth = updateAuth