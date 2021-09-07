const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { urlExists, getUserByEmail, isUserLoggedIn, generateRandomString, renderError } = require('./helpers');
const app = express();
const PORT = 8080;

app.use(express.static('public')); // allows displaying error image
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1','key2']
}));

const urlDatabase = {
// TEST URLS
//   b6UTxQ: {
//     longURL: "http://orteil.dashnet.org/cookieclicker/",
//     userID: "123456"
//   },
//   i3BoGr: {
//     longURL: "https://www.google.ca",
//     userID: "aJ48lW"
//   },
//   l2XoRs: {
//     longURL: "https://certbot.eff.org",
//     userID: "123456"
// }
};

const users = {
// TEST USERS
//   "123456": {
//     id: "123456",
//     email: "kale@salad.com",
//     password: "purple"
//   },
//  "789012": {
//     id: "789012",
//     email: "user2@example.com",
//     password: "dishwasher-funk"
//   }
};

// Root index
app.get('/', (req, res) => {
  if (!isUserLoggedIn(req, users)) {
    return res.redirect('/login');
  }
  const user = users[req.session.user_id];
  const templateVars = {
    urls: urlDatabase,
    userID: req.session.user_id,
    user: user
  };
  return res.render('./urls', templateVars);
});

//   - - - LOGIN / LOGOUT - - -

app.get('/login', (req, res) => {
  if (isUserLoggedIn(req, users)) {
    return res.redirect('/urls');
  }
  return res.render('login');
});

app.post('/login', (req, res) => {
  
  if (isUserLoggedIn(req, users)) {
    return res.redirect('/urls');
  }

  const emailLogin = req.body.email;
  const passwordLogin = req.body.password;
  const user = getUserByEmail(emailLogin, users);
  
  if (!getUserByEmail(emailLogin, users)) {
    const customMsg = 'A user with that email does not exist';
    return renderError(403, customMsg, res);
  }

  if (emailLogin && bcrypt.compareSync(passwordLogin, user.password)) {
    req.session.user_id = user.id;
    return res.redirect('/urls');
  }

  const customMsg = 'You may have entered the wrong user name or password';
  return renderError(403, customMsg, res);
});

app.post('/logout', (req, res) => {
  req.session = null;
  return res.redirect('/urls');
});


//  - - - REGISTRATION - - -

app.get('/register', (req, res) => {
  if (isUserLoggedIn(req, users)) {
    return res.redirect('/urls');
  }
  return res.render('register');
});

app.post('/register', (req, res) => {
  const newUserEmail = req.body.email;
  const newPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
  if (newUserEmail === '') {
    const customMsg = 'That email is already in use';
    return renderError(400, customMsg, res);
  }
  if (newPassword === '') {
    const customMsg = 'You have to enter a password';
    return renderError(400, customMsg, res);
  }
  if (!getUserByEmail(newUserEmail, users)) {
    const genUserID = generateRandomString(6);
    users[genUserID] = {id: genUserID, email: newUserEmail, password: hashedPassword};
    req.session.user_id = genUserID;
  }
  return res.redirect('/urls');
});

//  - - - CRUD / ROUTING - - -

app.post('/urls/:shortURL/delete', (req, res) => {
  const reqCookieID = req.session.user_id;
  const shortURL = req.params.shortURL;
  
  if (!req.session.user_id) {
    const customMsg = 'You must be logged in.';
    return renderError(403, customMsg, res);
  }
  if (reqCookieID !== urlDatabase[shortURL].userID) {
    const customMsg = 'You cannot delete this url. If it belongs to you please login and try again.';
    return renderError(403, customMsg, res);
  }
    
  delete urlDatabase[shortURL];
  return res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    const customMsg = 'Website Not Found';
    return renderError(404, customMsg, res);
  }
  const convertedURL = urlDatabase[req.params.shortURL].longURL;
  return res.redirect('http://' + convertedURL);
});

app.post('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;

  if (!isUserLoggedIn(req, users)) {
    const customMsg = 'You are not logged in...';
    return renderError(403, customMsg, res);
  }

  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    const customMsg = 'Insufficient Permissions: you must be the creator of this url to edit it.';
    return renderError(403, customMsg, res);
  }
  urlDatabase[shortURL].longURL = longURL;
  return res.redirect('/urls');
});

app.get('/urls/new', (req, res) => {
  const reqCookieID = req.session.user_id;
  const user = users[reqCookieID];
  
  const templateVars = {
    urls: urlDatabase,
    userID: reqCookieID,
    user: user
  };

  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  return res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  const randId = generateRandomString(6);
  urlDatabase[randId] = { longURL: req.body.longURL, userID: req.session.user_id};
  return res.redirect(`/urls/${randId}`);
});

app.get('/urls', (req, res) => {
  const reqCookieID = req.session.user_id;
  const user = users[reqCookieID];
  const userURLs = {};

  if (!isUserLoggedIn(req, users)) {
    return res.redirect('/login');
  }
  
  if (!req.session.user_id) {
    return res.redirect('/login');
  }

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === reqCookieID) {
      userURLs[url] = urlDatabase[url];
    }
  }
  const templateVars = {
    urls: userURLs,
    userID: reqCookieID,
    user: user
  };
  return res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const reqCookieID = req.session.user_id;
  const short = req.params.shortURL;
  const userOwnedURLs = {};
  const user = users[req.session.user_id];
  
  if (!isUserLoggedIn(req, users)) {
    const customMsg = 'You are not logged in';
    return renderError(403, customMsg, res);
  }

  if (req.session.user_id !== urlDatabase[short].userID) {
    const customMsg = 'Insufficient Permissions: you must be the creator of this url to edit it.';
    return renderError(403, customMsg, res);
  }

  if (!urlExists(short, urlDatabase)) {
    const customMsg = 'URL does not exist';
    return renderError(404, customMsg, res);
  }

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === reqCookieID) {
      userOwnedURLs[url] = urlDatabase[url];
    }
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[short].longURL,
    userID: reqCookieID,
    userURLs: userOwnedURLs,
    user: user
  };

  return res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`tiny app listening on port ${PORT}!`);
});