const express = require('express');
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
    console.log('fn: emailExists | key in users:', id);
    console.log('fn: emailExists | email in users:', users[id].email);
    if (email === users[id].email){
      return id;
    }
  }
  return false;
}

function generateRandomString(length = 6) {
  return Math.random().toString(16).substr(2, length);
}

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// PROVIDED BY COMPASS
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "kale@salad.com", 
    password: "purple"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}


// MIDDLE WARE

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// const cookieSession = require('cookie-session');
// app.use(cookieSession);


// - - - ROUTING - - - 

// Root index
app.get('/', (req, res) => {
  console.log('Cookies: ', req.cookies);
  const user = users[req.cookies.user_id];
  console.log('user object using cookies: >>> ', user);
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies['user_id'],
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
  const emailLogin = req.body.email; // from lecture
  const passwordLogin = req.body.password;
  // const foundUser = getUserByEmail(userGiven); // from lecture
  const idFromEmail = emailExists(emailLogin);
  if (!emailExists(emailLogin)) {
    res.status(403).send('User with that email does not exist');
  } else {
    if (emailLogin && users[idFromEmail].password === passwordLogin) {
      res.cookie('user_id',idFromEmail);
      res.redirect('/urls'); // TODO Profile does not exist
    }
  }
  
});

// Logout POST
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


//
//  - - - REGISTRATION - - -
//

// REGISTER GET Register page
app.get('/register', (req, res) => {
  if (req.cookies.user_id){
    res.redirect('/urls');
  }
  res.render('register');
});

// REGISTER POST This should add new user object to the global user object
app.post('/register', (req, res) => {
  console.log('register req body: >>>', req.body);
  const newUserEmail = req.body.email;
  const newPassword = req.body.password;
  
  if (newUserEmail !== '' || newPassword !== '') {
    if (!emailExists(newUserEmail)) {
    const genUser_id = generateRandomString(6);
    users[genUser_id] = {id: genUser_id, email: newUserEmail, password: newPassword};
    console.log('🔥 Registers new users object: >>>', users);
    res.cookie('user_id', genUser_id);
    res.redirect('/urls');
    } else {
    res.status(400).send('email already in use');
    res.status(400);
    }
  }

});


//
//  - - - CRUD - - - 
//

// Delete POST /urls/:shortURL/delete --- on press of delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  console.log('short url passed after delete click', shortURL);
  delete urlDatabase[shortURL];
  res.redirect('/urls'); // on Delete("Destroy") redirects back to url index
});

// Redirect from tiny url to actual 
app.get('/u/:shortURL', (req, res) => {              // takes the shortURL link request
  const longURL = urlDatabase[req.params.shortURL];  // and links to the actual(longURL) by referencing 
  res.redirect(longURL);                             // the urlDatabase variables based on the :shortURL passed
});

// Update a URL with POST
app.post('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

// brings us to each urls specific page
app.get('/urls/:shortURL', (req, res) => {
  const reqCookie_id = req.cookies['user_id'];
  const user = users[reqCookie_id];
  console.log('get urls/:shortURL  >>>', req.cookies['user_id']);
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user_id: reqCookie_id,
    user: user
  };
  console.log(req.params.longURL)
  if(!req.cookies['user_id']) {
    res.redirect('/login');
  }
  res.render('urls_show', templateVars);
});

// Add a new url with POST 
app.post('/urls', (req, res) => {
  console.log(req.body);
  const randId = generateRandomString();
  urlDatabase[randId] = req.body.longURL; // insert new shortURL : longURL key-value pairs to our urlDatabase obj
  res.redirect(`/urls/${randId}`);                    // redirect to specific shortURL key site
});

app.get('/urls', (req, res) => {
  const reqCookie_id = req.cookies['user_id'];
  const user = users[reqCookie_id];
  console.log(' THE USERSSS OBJECT >>> ', users);
  console.log('THE USER OBJECT >>> ', user);
  const templateVars = {
    urls: urlDatabase,
    user_id: reqCookie_id,
    user: user

  };
  if (!req.cookies['user_id']){
    res.redirect('/login');
  }
  res.render('urls_index', templateVars);
});

// Create new tiny URLs
app.get('/urls/new', (req, res) => {
  const reqCookie_id = req.cookies['user_id'];
  const user = users[reqCookie_id]; 
  
  const templateVars = { 
    urls: urlDatabase,
    user_id: reqCookie_id,
    user: user

  };

  if(!req.cookies['user_id']){
    res.redirect('/login');
  } 
  
  res.render('urls_new', templateVars);

});




app.listen(PORT, () => {
  console.log(`tiny app listening on port ${PORT}!`);
});


// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });
