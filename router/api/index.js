var express = require('express');
var passport = require('../auth/passport');

module.exports = function(app){
	console.log('API module');

	var router = new express.Router();

	require('./user')(router);
	require('./verify')(router);
	require('./session')(router);
	require('./training')(router);
	require('./sockets')(app);

	app.use('/api', passport.isAuthenticated, router);
};
