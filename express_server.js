const express = require('express');
var cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

// const getUserByEmail = (email) => { // pulled from lecture with 
//   for (let key in users) {
//     console.log("key", key);
//     const user = user[key];
//   }
// }

const emailExists = (email) => {
  for (let id in users) {
    console.log('✉️ >> emailExists << looping id: ', id, 'users[id]=', users[id], 'users[id].email=', users[id].email);
    if (email === users[id].email){
      return id;
    }
  }
  return false;
}

const urlExists = (short_url) => {
  for (let url in urlDatabase){
    if (url === short_url) {
      return true;
    }  
  }
  return false;
}

function generateRandomString(length = 6) {
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
}


// MIDDLE WARE




app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1','key2']
})
);

// const cookieSession = require('cookie-session');
// app.use(cookieSession);


// - - - ROUTING - - - 

// Root index
app.get('/', (req, res) => {
  console.log('Cookies: ', req.session);
  const user = users[req.session.user_id];
  console.log('user object using session: >>> ', user);
  const templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id,
    user: user

   };
  //  templateVars.user = users[req.cookies.usermail]; // pulled from lecture 
  res.render('./index', templateVars);
});

//
//   - - - LOGIN / LOGOUT - - -
//

app.get('/login', (req, res) => {
  console.log('login get res.body', res.body)
  res.render('login');
});

// Login POST
app.post('/login', (req, res) => {
  console.log('login post req.body', req.body);
  const emailLogin = req.body.email;
  const passwordLogin = req.body.password;
  const idFromEmail = emailExists(emailLogin);
  
  if (!emailExists(emailLogin)) {
    res.status(403).send('User with that email does not exist');
  } 
  // if (emailLogin && users[idFromEmail].password === passwordLogin) {
  if (emailLogin && bcrypt.compareSync(passwordLogin, users[idFromEmail].password)) {
    req.session.user_id = idFromEmail;
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
    res.status(400).send('email already in use');
  }
  if (newPassword === '') {
    res.status(400).send('you have to enter a password.');
  }
  if (!emailExists(newUserEmail)) {
    const genUser_id = generateRandomString(6);
    users[genUser_id] = {id: genUser_id, email: newUserEmail, password: hashedPassword};
    console.log('🔥 Registering new user');
    req.session.user_id = genUser_id;
    
  }
  res.redirect('/urls');

});


//
//  - - - CRUD / OTHER - - - 
//

// Delete POST /urls/:shortURL/delete --- on press of delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  const reqCookie_id = req.session.user_id;
  const shortURL = req.params.shortURL;
  
  if (!req.session.user_id){
    // you have to be logged in dude. 
    res.status(403).send('You have to be logged in, friendo.');
    return
  }
  if (reqCookie_id !== urlDatabase[shortURL].userID) {
    res.status(403).send('You do not have the permissions for that')
    return
  }
    
  delete urlDatabase[shortURL];
  res.redirect('/urls'); // on Delete("Destroy") redirects back to url index
});

// Redirect from tiny url to actual 
app.get('/u/:shortURL', (req, res) => {              // takes the shortURL link request
  const longURL = urlDatabase[req.params.shortURL].longURL;  // and links to the actual(longURL) by referencing 
  res.redirect(longURL);                             // the urlDatabase variables based on the :shortURL passed
});

// Update a URL with POST
app.post('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls');
});


app.get('/urls/new', (req, res) => {
  console.log('urls new body >>> ', req.body);
  const reqCookie_id = req.session.user_id;
  const user = users[reqCookie_id]; 
  
  const templateVars = { 
    urls: urlDatabase,
    user_id: reqCookie_id,
    user: user
  };

  if(!req.session.user_id){
    res.redirect('/login');
  } 
  
  res.render('urls_new', templateVars);

});


// Add a new url with POST 
app.post('/urls', (req, res) => {
  console.log(req.body);
  console.log('cookies >>> ', req.session);
  const randId = generateRandomString();
  urlDatabase[randId] = { longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${randId}`);                    // redirect to specific shortURL key site
});

// GET urls page
app.get('/urls', (req, res) => {
  const reqCookie_id = req.session.user_id;
  console.log('req cookie >>> ', req.session.user_id);
  const user = users[reqCookie_id];
  console.log('user using users[reqCookie_id] >>> ', user);
  const userURLs = {};
  
  if (!req.session.user_id){
    res.redirect('/login');
  }
  for (let url in urlDatabase){ //make this into an outside function
    if (urlDatabase[url].userID === reqCookie_id){
      userURLs[url] = urlDatabase[url];
      console.log('for-if userURLs url obj >>>', userURLs);
    }
    console.log('USERS URLS OBJ >>> ', userURLs);
  }
  const templateVars = {
    urls: userURLs,
    user_id: reqCookie_id,
    user: user
  };
  res.render('urls_index', templateVars);
});

// brings us to each urls specific page
app.get('/urls/:shortURL', (req, res) => {
  console.log('urls :short req params >>> ', req.params);
  const reqCookie_id = req.session.user_id;
  const user = users[reqCookie_id];
  const short = req.params.shortURL;
  console.log('PARAMS FOR SHORT: >>>', req.params.shortURL);
  const userOwnedURLs = {};
  
  if(!req.session.user_id) { // if not logged in
    // res.redirect('/login');
    res.status(403).send('I don\'t think that belongs to you...');
  }

  if(!urlExists(short)) { // if url doesn't exist
  res.status(404).send('There ain\'t seem to be such a place...');
  }

  for( let url in urlDatabase) {
    if(urlDatabase[url].userID === reqCookie_id){
      userOwnedURLs[url] = urlDatabase[url];
    }
  }

  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[short].longURL,
    user_id: reqCookie_id,
    user: userOwnedURLs
  };
  res.render('urls_show', templateVars);
});


app.listen(PORT, () => {
  console.log(`tiny app listening on port ${PORT}!`);
});


// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });
