var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Page = require('../models/page.js');
var adminUser = require('../models/admin-users.js');


function sessionCheck(req, res, next){
	if(req.session.user) next();
		else res.send(401,'Auth failed');
}

/* User Routes */

router.get('/', function(req,res){
	res.send('Welcome to the API zone');
});

router.get('/pages', function(req, res){

	return Page.find(function(err,pages){
		if (!err) {
			return res.send(pages);
		} else {
			return res.send(500, err);
		}
	});
});

router.post('/pages/add', sessionCheck, function(req,res){
	var page = new Page({
		title: req.body.title,
		url: req.body.url,
		content: req.body.content,
		menuIndex: req.body.menuIndex,
		date: new Date(Date.now())
	});

	page.save(function(err){
		if(!err){
			return res.send(200, page);
		} else {
			return res.send(500, err);
		}
	});
});

router.post('/pages/update', sessionCheck, function(req,res){
	var id = req.body._id;

	Page.update({
		_id: id
		}, {
			$set: {
				title: req.body.title,
				url: req.body.url,
				content: req.body.content,
				menuIndex: req.body.menuIndex,
				date: new Date(Date.now())
			}
		}).exec();
	res.send("Page updated");
});

router.get('/pages/delete/:id', sessionCheck, function(req,res){
	var id = req.params.id;
	Page.remove({ _id: id }, function(err){
		return console.log(err);
	});
	return res.send('Page id - ' + id + ' has been deleted');
});

router.get('/pages/admin-details/:id', sessionCheck, function(req,res){
	var id = req.params.id;

	Page.findOne({ _id: id }, function(err, page){
		if(err)
			return console.log(err);
		return res.send(page);
	});
});

router.get('/pages/details/:url', function(req,res){
	var url = req.params.url;

	Page.findOne({ url: url }, function(err, page){
		if(err)
			return console.log(err);
		return res.send(page);
	});
});

router.post('/add-user', function(req,res){
	var salt, hash, password;
	password = req.body.password;
	salt = bcrypt.genSaltSync(10);
	hash = bcrypt.hashSync(password, salt);

	var AdminUser = new adminUser({
		username: req.body.username,
		password: hash
	});

	AdminUser.save(function(err){
		if(!err){
			return res.send("Admin User created");
		} else {
			res.send(err);
		}
	});
});

router.post('/login', function(req,res){
	var username = req.body.username;
	var password = req.body.password;

	adminUser.findOne({ username: username }, function(err, data){
		if (err | data === null) {
			return res.send(401, "User doesn't exist");
		} else {
			var usr = data;

			if (username == usr.username && bcrypt.compareSync(password, usr.password)){
				req.session.regenerate(function(){
					req.session.user = username;
					return res.send(username);
				});
			} else {
				return res.send(401, "Bad username or password");
			}
		}
	});
});

router.get('/logout', function(req,res){
	req.session.destroy(function(){
		return res.send(401, 'User logged out');
	});
});

module.exports = router;