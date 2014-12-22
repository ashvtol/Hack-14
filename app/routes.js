// app/routes.js
var User       		= require('../app/models/user');
module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/canvas', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});
	app.get('/canvas', isLoggedIn, function(req, res) {
		res.render('canvas.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

// =====================================
	// CHANGE PASSWORD SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/change', isLoggedIn, function(req, res) {
		res.render('change.ejs', {
			message: req.flash('changeMessage')

		});
	});
	// process the change form
	app.post('/change', isLoggedIn, function(req, res){
		console.log('d');
        User.findOne({ 'local.email' :  req.user.email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                res.render('change.ejs', {
			message: 'Error!'});

            // if no user is found, return the message
            if (!user)
				res.render('change.ejs', {	message: 'No user found.'});

            // if the user is found but the password is wrong
            if (!user.validPassword(req.body.old))
                res.render('change.ejs', {	message: 'Oops! Wrong password.'}); // create the changeMessage and save it to session as flashdata

            user.local.password = user.generateHash(req.body.password);

            // save the user
                user.save(function(err) {
                    if (err)
                        throw err;
                });
            res.render('change.ejs', {	message: 'Password Changed!'});
        });
	});
	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
