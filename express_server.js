const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { urlExists, getUserByEmail, isUserLoggedIn, generateRandomString } = require('./helpers');
const PORT = 8080;
const app = express();

// 400 Bad Request
// 401 Unauthorized
// 403 Forbidden

// - - - Middle Ware - - -

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

//
// - - - ROOT URL - - -
//

// Root index
app.get('/', (req, res) => { // check if user is logged in
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

//
//   - - - LOGIN / LOGOUT - - -
//

app.get('/login', (req, res) => {
  if (isUserLoggedIn(req, users)) {
    return res.redirect('/urls');
  }
  return res.render('login');
});

// Login POST
app.post('/login', (req, res) => {
  
  if (isUserLoggedIn(req, users)) {
    return res.redirect('/urls');
  }

  const emailLogin = req.body.email;
  const passwordLogin = req.body.password;
  const user = getUserByEmail(emailLogin, users);
  
  if (!getUserByEmail(emailLogin, users)) {
    return res.status(403).send('A user with that email does not exist');
  }

  if (emailLogin && bcrypt.compareSync(passwordLogin, user.password)) {
    // Successful Login
    req.session.user_id = user.id;
    return res.redirect('/urls');
  }

  return res.status(403).send('Something went wrong'); // TODO Profile does not exist ⚠️
});

// Logout POST
app.post('/logout', (req, res) => {
  req.session = null;
  return res.redirect('/urls');
});


//
//  - - - REGISTRATION - - -
//

// REGISTER GET Register page
app.get('/register', (req, res) => {
  if (isUserLoggedIn(req, users)) {
    return res.redirect('/urls');
  }
  return res.render('register');
});

// REGISTER POST This should add new user object to the global user object
app.post('/register', (req, res) => {
  const newUserEmail = req.body.email;
  const newPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
  if (newUserEmail === '') {
    return res.status(400).send('that email is already in use');
  }
  if (newPassword === '') {
    return res.status(400).send('you have to enter a password.');
  }
  if (!getUserByEmail(newUserEmail, users)) {
    const genUserID = generateRandomString(6);
    users[genUserID] = {id: genUserID, email: newUserEmail, password: hashedPassword};
    req.session.user_id = genUserID;
  }
  return res.redirect('/urls');
});

//
//  - - - CRUD / ROUTING - - -
//

// Delete POST /urls/:shortURL/delete --- on press of delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  const reqCookieID = req.session.user_id;
  const shortURL = req.params.shortURL;
  
  if (!req.session.user_id) {
    return res.status(403).send('You have to be logged in.');
  }
  if (reqCookieID !== urlDatabase[shortURL].userID) {
    return res.status(403).send('You do not have the permissions for that');
  }
    
  delete urlDatabase[shortURL];
  return res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(403).send('Website Not Found');
  }
  const convertedURL = urlDatabase[req.params.shortURL].longURL
  // const longURL = urlDatabase[req.params.shortURL].longURL;
  return res.redirect('http://'+ convertedURL);
});

app.post('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;

  if (!isUserLoggedIn(req, users)) {
    return res.status(403).send('You are not logged in');
  }

  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    return res.status(403).send('Insufficient Permissions: you must be the creator of this url to edit it.');
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

// Add a new url with POST
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
    return res.status(403).send('You are not logged in');
  }

  if (req.session.user_id !== urlDatabase[short].userID) {
    return res.status(403).send('Insufficient Permissions: you must be the creator of this url to edit it.');
  }

  if (!urlExists(short, urlDatabase)) {
    return res.status(404).send('URL does not exist)');
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