/* The express module is used to look at the address of the request and send it to the correct function */
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var usermodel = require('./user.js').getModel();
var postmodel = require('./post.js').getModel();
var organizationmodel = require('./organization.js').getModel();
var crypto = require('crypto');
var mongoose = require('mongoose')
var path = require('path');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var session = require('express-session');
var fs = require('fs')
var app = express();
var server = http.createServer(app);
var iterations = 10000;
var Io = require('socket.io');
var io = Io(server);

/* Defines what port to use to listen to web requests */
var port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

var dbAddress = process.env.MONGODB_URI || 'mongodb://127.0.0.1/nonprofiteering'

function addSockets(){
  io.on('connection', (socket) =>{
    socket.on('newPost', (post) => {
  		io.emit('post', post);
  	});
  });
}

function startServer() {
  addSockets();
  function authenticateUser(username, password, callback) {
    if (!username) return callback('No username given');
    if (!password) return callback('No password given');
    usermodel.findOne({
      username: username
    }, (err, user) => {
      if (err) return callback('Error connecting to database');
      if (!user) return callback('Incorrect Username');
      crypto.pbkdf2(password, user.salt, iterations, 256, 'sha256', (err, resp) => {
        if (err) return callback('Error handling password');
        if (resp.toString('base64') === user.password) return callback(null, user);
        callback('Incorrect password');
      });
    })
  }


  app.use(bodyParser.json({
    limit: '16mb'
  }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(session({
    secret: 'Knowledge'
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, authenticateUser));
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    usermodel.findById(id, function(err, user) {
      done(err, user);
    })
  })

  app.get('/checkout', (req, res, next) => {
    var filePath = path.join(__dirname, '/checkout.html');
    res.sendFile(filePath);
  });

	app.post('/newproject', (req, res, next) => {
		if(!req.user) return res.redirect('/login');
		var newproject = new projectmodel(req.body);
		newproject.dateCreated = new Date();
		newproject.owner = req.user;
		newproject.save((err, resp) => {
			res.send(`/createproject/${newproject._id}`);
		});
	});

  app.post('/feed', (req, res, next) => {
    if(!req.user) return res.send({error: 'Not Logged In'});
		var newpost = new postmodel(req.body);
		newpost.dateCreated = new Date();
		newpost.author = req.user._id;
		newpost.save((err, resp) => {
			res.send({success: true});
		});
  })

	app.get('/createproject/:id', (req, res, next) => {
		if(!req.user) return res.redirect('/login');
		projectmodel.findById(req.params.id).populate('owner').exec((err, project) => {
			if(err || !project) {
				return next();
			}
			var filePath = path.join(__dirname, './editproject.html');
			var projectPage = fs.readFileSync(filePath, 'utf8');
			var projectData = project.toJSON();
			cleanUpUser(projectData.owner);
			projectPage = projectPage.replace('{{DATA}}', JSON.stringify(projectData));
			res.send(projectPage);
		})

	});

  app.get('/organizationprofile/:id', (req, res, next) =>{
    if(!req.user) return res.send({error: 'Not Logged In'});
    organizationmodel.findById(req.params.id).exec((err, org) => {
      if(err) {
        return res.send(err);
      }
      var filePath = path.join(__dirname, '/organizationprofile.html');
      var fileContents = fs.readFileSync(filePath, 'utf8');
      fileContents = fileContents.replace('{{ORG}}', JSON.stringify(org));

      var isOwner = (req.user.organization || []).map(o => o.toString()).includes(org._id + '');
      fileContents = fileContents.replace('{{ISOWNER}}', JSON.stringify(isOwner));
      res.send(fileContents);
    })
  });

  app.get('/organizationfollowers', (req, res, next) =>{
    if(!req.user) return res.send({error: 'Not Logged In'});
    var filePath = path.join(__dirname, '/organizationfollowers.html');
    var fileContents = fs.readFileSync(filePath, 'utf8')
    res.send(fileContents)
  });

  app.get('/organizationfollowing', (req, res, next) =>{
    if(!req.user) return res.send({error: 'Not Logged In'});
    var filePath = path.join(__dirname, '/organizationfollowing.html');
    var fileContents = fs.readFileSync(filePath, 'utf8')
    res.send(fileContents)
  });

  app.get('/individualprofile', (req, res, next) =>{
    if(!req.user) return res.redirect('/login');
    var filePath = path.join(__dirname, '/individualprofile.html');
    var fileContents = fs.readFileSync(filePath, 'utf8')
    var username = req.user ? req.user.username : '';
    var name = req.user ? req.user.name : '';
    var organization = req.user ? req.user.organization : '';
    var profile_picture = req.user ? req.user.profile_picture : '';
    var fileContents = fs.readFileSync(filePath, 'utf8');
    console.log(req.user);
    console.log(req.user.name);
    fileContents = fileContents.replace(new RegExp('{{USERNAME}}', 'g'), username)
    fileContents = fileContents.replace(new RegExp('{{NAME}}', 'g'), name)
    fileContents = fileContents.replace(new RegExp('{{ORG}}', 'g'), organization)
    fileContents = fileContents.replace(new RegExp('{{PROFPIC}}', 'g'), profile_picture)
    res.send(fileContents)
  });

  app.get('/itempage', (req, res, next) =>{
    var filePath = path.join(__dirname, '/itempage.html');
    var fileContents = fs.readFileSync(filePath, 'utf8')
    res.send(fileContents)
  });

  app.get('/editindividualprofile', (req, res, next) =>{
    var filePath = path.join(__dirname, '/editindividualprofile.html');
    var fileContents = fs.readFileSync(filePath, 'utf8')
    res.send(fileContents)
  });

  app.get('/main.css', (req, res, next) =>{
    var filePath = path.join(__dirname, '/main.css');
    var fileContents = fs.readFileSync(filePath, 'utf8')
    res.send(fileContents)
  });

  app.get('/continuetocheckout', (req, res, next) =>{
    var filePath = path.join(__dirname, '/continuetocheckout.html');
    var fileContents = fs.readFileSync(filePath, 'utf8')
    res.send(fileContents)
  });

  app.get('/individualprofile', (req, res, next) =>{
    if(!req.user) return res.redirect('/login');
    var filePath = path.join(__dirname, '/individualprofile.html');
    var fileContents = fs.readFileSync(filePath, 'utf8')
    res.send(fileContents)
  });

  app.get('/allfeeds', (req, res, next) => {
    if(!req.user) return res.send({error: 'Not Logged In'});
    postmodel.find({})
      .populate('author')
      .select('author.username author._id title contents dateCreate file')
      .exec(function(err, feeds){
        res.send(err || feeds.map(f => {
          return {
            author: {
              _id: f.author._id
              , username: f.author.username
            }
            , title: f.title
            , contents: f.contents
            , dateCreate: f.dateCreate
            ,file: f.file
          }
        }
      ));
    })
  });

  app.get('/feed', (req, res, next) => {
    if(!req.user) return res.redirect('/login');
    var filePath = path.join(__dirname, '/feed.html');
    var username = req.user ? req.user.username : '';
    var fileContents = fs.readFileSync(filePath, 'utf8')
    fileContents = fileContents.replace(new RegExp('{{USER}}', 'g'), username)
    fileContents = fileContents.replace(new RegExp('{{USERID}}', 'g'), req.user._id)
    res.send(fileContents)
  });

  app.get('/createproject', (req, res, next) => {
    var filePath = path.join(__dirname, '/createproject.html');
    res.sendFile(filePath);
  });

  app.get('/createproject.js', (req, res, next) => {
    var filePath = path.join(__dirname, '/createproject.js');
    res.sendFile(filePath);
  });

  app.get('/organizationsignup', (req, res, next) => {
    if(!req.user) return res.redirect('/login');
    var filePath = path.join(__dirname, '/organizationsignup.html');
    res.sendFile(filePath);
  });

  app.get('/createproject.css', (req, res, next) => {
    var filePath = path.join(__dirname, '/createproject.css');
    res.sendFile(filePath);
  });

  app.get('/signup', (req, res, next) => {
    var filePath = path.join(__dirname, '/signup.html');
    res.sendFile(filePath);
  });

  app.get('/login', (req, res, next) => {
    var filePath = path.join(__dirname, './login.html')
    res.sendFile(filePath);
  });

  app.get('/organization', (req, res, next) => {
    var filePath = path.join(__dirname, './organization.html')
    res.sendFile(filePath);
  });

  app.get('/projects', (req, res, next) => {
    var filePath = path.join(__dirname, './projects.html')
    res.sendFile(filePath);
  });

  app.post('/submitToken', (req, res, next) => {
    console.log(req.body);
    res.send('OK');
  })

  app.get('/feedback-form', (req, res, next) => {
    var filePath = path.join(__dirname, './feedback-form.html');
    res.sendFile(filePath);
  });

  app.get('/', (req, res, next) => {
    var filePath = path.join(__dirname, './home.html');
    var username = req.user ? req.user.username : '';
    var fileContents = fs.readFileSync(filePath, 'utf8')
    fileContents = fileContents.replace('{{USER}}', username)
    res.send(fileContents)
  });

  app.get('/promocode', (req, res, next) => {
    var filePath = path.join(__dirname, '/promocode.html');
    res.sendFile(filePath);
  });

  app.get('/logout', (req, res, next) => {
    req.logOut();
    res.redirect('/login');
  })

  app.get('/home.css', (req, res, next) => {
    var filePath = path.join(__dirname, './home.css');
    res.sendFile(filePath);
  });

  app.get('/editshop', (req, res, next) => {
    var filePath = path.join(__dirname, './editshop.html');
    res.sendFile(filePath);
  });

  app.get('/events', (req, res, next) => {
    var filePath = path.join(__dirname, './events.html');
    res.sendFile(filePath);
  });

  app.get('/search', (req, res, next) => {
    if(!req.user) return res.redirect('/login');
    var filePath = path.join(__dirname, './search.html');
    var fileContents = fs.readFileSync(filePath, 'utf8');
    rows = '';
    organizationmodel.find({}).exec(function(err, orgs) {
      if(err) {
        console.log(err)
        res.send(err);
        return;
      }
      fileContents = fileContents.replace('{{ORGS}}', JSON.stringify(orgs));
      res.send(fileContents);
    })
  });

  app.get('/groupapplication', (req, res, next) => {
    var filePath = path.join(__dirname, './groupapplication.html');
    res.sendFile(filePath);
  });

  app.get('/cart', (req, res, next) => {
    var filePath = path.join(__dirname, './cart.html');
    res.sendFile(filePath);
  });

  app.get('/organization/:id/profile/edit', (req, res, next) => {
    if(!req.user || req.user.role !== 'admin' || !req.user.organization || !req.user.organization.includes(req.params.id)) {
      res.status(403).redirect('/login');
      return;
    }
    var filePath = path.join(__dirname, './editorganizationprofile.html');
    res.sendFile(filePath);
  });

  app.get('/resources', (req, res, next) => {
    var filePath = path.join(__dirname, './resources.html');
    res.sendFile(filePath);
  });

  app.post('resources', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	});

  app.post('organizationsignup', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	});

  app.post('cart', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	});

  app.post('application', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	});

  app.post('editshop', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	});

  app.post('/', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	});

  app.post('/feedback-form', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	});

  app.post('/checkout', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	});

  app.post('/login', (req, res, next) => {
    passport.authenticate('local', function(err, user) {
      if (err) return res.send({
        error: err
      });

      req.logIn(user, (err) => {
        if (err) return res.send({
          error: err
        });
        res.send({redirect:'/individualprofile'});
      })
    })(req, res, next);
  });

  app.get('/profile/:username', (req, res, next) => {
    if (!req.user) return res.send('YOU ARE NOT LOGGED IN');
    usermodel.findOne({
      username: req.params.username
    }, function(err, user) {
      if (err) return res.send(err);
      try {
        var imageType = user.profile_picture.match(/^data:image\/([a-zA-Z0-9]*)/)[1];
        var base64Data = user.profile_picture.split(',')[1];
        var binaryData = new Buffer(base64Data, 'base64');
        res.contentType('image/' + imageType);
        res.end(binaryData, 'binary');
      } catch (ex) {
        res.send(ex);
      }
    })
  })

  app.post('/signup', (req, res, next) => {
    var d = req.body;
    d.organization = null;
    var newuser = new usermodel(d);
    console.log(Object.keys(d));

    var password = req.body.password;
    var salt = crypto.randomBytes(128).toString('base64');
    newuser.salt = salt;
    // Winding up the crypto hashing lock 10000 times
    crypto.pbkdf2(password, salt, iterations, 256, 'sha256', function(err, hash) {
      if (err) {
        return res.send({
          error: err
        });
      }
      newuser.password = hash.toString('base64');
      // Saving the user object to the database
      newuser.save(function(err) {

        // Handling the duplicate key errors from database
        if (err && err.message.includes('duplicate key error') && err.message.includes('username')) {
          return res.send({
            error: 'Username, ' + req.body.username + ' already taken'
          });
        }
        if (err) {
          return res.send({
            error: err.message
          });
        }
        passport.authenticate('local', function(err, user) {
          if (err) return res.send({
            error: err
          });

          req.logIn(user, (err) => {
            if (err) return res.send({
              error: err
            });
            res.send({success: 'ok'})
          })
        })(req, res, next);
      });
    });
  });

  app.post('/organization', (req, res, next) => {
    if(!req.user) return res.send({error: 'Not Logged In'});
    var neworganization = new organizationmodel(req.body);
    var password = req.body.password;
    var salt = crypto.randomBytes(128).toString('base64');
    neworganization.salt = salt;
    // Winding up the crypto hashing lock 10000 times
    crypto.pbkdf2(password, salt, iterations, 256, 'sha256', function(err, hash) {
      if (err) {
        return res.send({
          error: err
        });
      }
      neworganization.password = hash.toString('base64');
      // Saving the user object to the database
      neworganization.save(function(err, newOrg) {

        // Handling the duplicate key errors from database
        if (err && err.message.includes('duplicate key error') && err.message.includes('name')) {
          return res.send({
            error: 'Organization name, ' + req.body.name + 'already taken'
          });
        }
        if (err) {
          return res.send({
            error: err.message
          });
        }
        usermodel.findById(req.user._id, (err, user) => {
          if(err) {
            return res.send({error: err});
          }
          user.organization = user.organization || [];
          user.organization.push(newOrg._id);
          user.save((err) => {
            if(err) {
              return res.send({error: err});
            }
            res.send({id: newOrg._id});
          })
        })
      })
      });
    });
  }

  /* Defines what function to all when the server recieves any request from http://localhost:8080 */
  server.on('listening', () => {

    /* Determining what the server is listening for */
    var addr = server.address(),
      bind = typeof addr === 'string' ?
      'pipe ' + addr :
      'port ' + addr.port;

    /* Outputs to the console that the webserver is ready to start listenting to requests */
    console.log('Listening on ' + bind);
  });

/* Tells the server to start listening to requests from defined port */
server.listen(port);
mongoose.connect(dbAddress, startServer)
