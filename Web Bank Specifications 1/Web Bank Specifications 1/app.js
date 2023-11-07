const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const { generate } = require('randomstring');
const { requireUser } = require('./utils.js');

const users = require('./user.json');

const port = 3000;
const app = express();

// Serving static image and css files
app.use(express.static('public'));

// Setting the view engine to be handlebars
// And setting the layouts and partials location
// for the render engine
app.set('view engine', 'hbs');
app.engine(
  'hbs',
  engine({
    layoutsDir: `${__dirname}/views/layouts`,
    partialsDir: `${__dirname}/views/partials`,
    extname: 'hbs',
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Creating a session token and the secret
// is auto-generated using the randomstring npm module
app.use(
  session({
    secret: generate(),
    resave: false,
    saveUninitialized: true,
  })
);

app.get('/login', (req, res) => {
  return res.render('home', {
    title: 'Login',
    loginPage: true,
  });
});

app.get('/banking', requireUser, (req, res) => {
  const { username } = req.session;
  return res.render('home', {
    title: 'Banking',
    bankPage: true,
    username,
  });
});

app.post('/login', (req, res) => {
  let error = new Error('');

  // Try catch block helps to catch
  // errors easily and deal with it
  try {
    const { username, password } = req.body;

    if (username === '' || password === '') {
      error.message = 'Enter both username and password';
      throw error;
    }

    // An array of the keys in the users object is extracted
    const isValidUser = Object.keys(users).includes(username);

    // An array of the values in the users object is extracted
    const isValidPassword = Object.values(users).includes(password);

    if (!isValidUser) {
      error.message = 'Not a registered username';
      throw error;
    }

    if (!isValidPassword) {
      error.message = 'Invalid password';
      throw error;
    }

    // username is added to session object
    // which will passed onto future HTTP requests
    req.session.username = username;
    return res.redirect('/banking');
  } catch (err) {
    return res.render('home', {
      title: 'Login',
      loginPage: true,
      gotError: true,
      errorMessage: err.message,
    });
  }
});

app.post('/logout', (req, res) => {
  // On logout, the req.session is deleted
  // which tells the browser to delete the
  // cookie stored as the session token
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.sendStatus(500);
      } else {
        return res.redirect('/login');
      }
    });
  }
});

app.listen(port, async () => {
  console.info(`Server started at http://localhost:${port}/login`);
});
