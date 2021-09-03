const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const helper = require('./helpers');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');



const generateRandomString = function(length = 6) {
  return Math.random().toString(16).substr(2, length);
}

const urlDatabase = {
  b6UTxQ: {
    longURL: "http://orteil.dashnet.org/cookieclicker/",
    userID: "123456"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  l2XoRs: {
    longURL: "https://certbot.eff.org",
    userID: "123456"
}
};

const users = {
  "123456": {
    id: "123456", 
    email: "kale@salad.com", 
    password: "$2b$10$c8b.8LQpT8Rdykq7EMvPO.INOe.bmSiBbrUr05kFxCL7H87wXxWsO" // password: purple
  },
 "789012": {
    id: "789012", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

//
// - - - MIDDLE WARE - - -
//
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1','key2']
}));

//
// - - - ROUTING - - - 
//

// Root index
app.get('/', (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id,
    user: user
  };
  res.render('./index', templateVars);
});

//
//   - - - LOGIN / LOGOUT - - -
//

app.get('/login', (req, res) => {
  console.log('login get res.body', res.body);
  res.render('login');
});

// Login POST
app.post('/login', (req, res) => {
  console.log('login post req.body', req.body);
  const emailLogin = req.body.email;
  const passwordLogin = req.body.password;
  const user = helper.getUserByEmail(emailLogin, users);
  
  if (!helper.getUserByEmail(emailLogin, users)) {
    res.status(403).send('User with that email does not exist');
  } 
  // if (emailLogin && users[idFromEmail].password === passwordLogin) {
  if (emailLogin && bcrypt.compareSync(passwordLogin, user.password)) {
    req.session.user_id = user.id;
  }
  res.redirect('/urls'); // TODO Profile does not exist
});

// Logout POST
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


//
//  - - - REGISTRATION - - -
//

// REGISTER GET Register page
app.get('/register', (req, res) => {
  if (req.session.user_id){
    res.redirect('/urls');
  }
  res.render('register');
});

// REGISTER POST This should add new user object to the global user object
app.post('/register', (req, res) => {
  console.log('register req body: >>>', req.body);
  const newUserEmail = req.body.email;
  const newPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newPassword, 10)
  
  if (newUserEmail === '') {
    res.status(400).send('that email is already in use');
  }
  if (newPassword === '') {
    res.status(400).send('you have to enter a password.');
  }
  if (!helper.getUserByEmail(newUserEmail, users)) {
    const genUserID = generateRandomString(6);
    users[genUserID] = {id: genUserID, email: newUserEmail, password: hashedPassword};
    req.session.user_id = genUserID;
  }
  res.redirect('/urls');
});

//
//  - - - CRUD / OTHER - - - 
//

// Delete POST /urls/:shortURL/delete --- on press of delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  const reqCookieID = req.session.user_id;
  const shortURL = req.params.shortURL;
  
  if (!req.session.user_id){
    res.status(403).send('You have to be logged in, friendo.');
    return;
  }
  if (reqCookieID !== urlDatabase[shortURL].userID) {
    res.status(403).send('You do not have the permissions for that')
    return;
  }
    
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls');
});

app.get('/urls/new', (req, res) => {
  console.log('urls new body >>> ', req.body);
  const reqCookieID = req.session.user_id;
  const user = users[reqCookieID]; 
  
  const templateVars = {
    urls: urlDatabase,
    user_id: reqCookieID,
    user: user
  };

  if (!req.session.user_id){
    res.redirect('/login');
  } 
  
  res.render('urls_new', templateVars);
});

// Add a new url with POST 
app.post('/urls', (req, res) => {
  const randId = generateRandomString();
  urlDatabase[randId] = { longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${randId}`);
});

// GET urls page
app.get('/urls', (req, res) => {
  const reqCookieID = req.session.user_id;
  const user = users[reqCookieID];
  const userURLs = {};
  
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === reqCookieID) {
      userURLs[url] = urlDatabase[url];
    }
  }
  const templateVars = {
    urls: userURLs,
    user_id: reqCookieID,
    user: user
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const reqCookieID = req.session.user_id;
  const user = users[reqCookieID];
  const short = req.params.shortURL;
  const userOwnedURLs = {};
  
  if(!req.session.user_id) {
    res.status(403).send('I don\'t think that belongs to you. (You need to be logged in)');
  }

  if(!helper.urlExists(short, urlDatabase)) {
  res.status(404).send('There ain\'t seem to be such a place. (URL does not exist)');
  }

  for(let url in urlDatabase) {
    if (urlDatabase[url].userID === reqCookieID) {
      userOwnedURLs[url] = urlDatabase[url];
    }
  }

  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[short].longURL,
    user_id: reqCookieID,
    user: userOwnedURLs
  };
  res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`tiny app listening on port ${PORT}!`);
});