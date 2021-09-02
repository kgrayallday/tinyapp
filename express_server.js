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
    if (email === users[id].email){
      return true;
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
    email: "kale@salad.ca", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

// const users = {
//   'k@m.g' : 'test'
// }


// MIDDLE WARE

// TODO ADD COOKIE SESSION
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// const cookieSession = require('cookie-session');
// app.use(cookieSession);





// ROUTING --------------

// Root index
app.get('/', (req, res) => {
  console.log('Cookies: ', req.cookies);
  console.log('req.query->', req.query);
  const templateVars = {
    urls: urlDatabase,
    usermail: req.cookies['usermail'],
    user_id: req.cookies['user_id']
   };
  //  templateVars.user = users[req.cookies.usermail]; // pulled from lecture 
  res.render('./pages/index', templateVars);
});

//
//   - - - LOGIN / LOGOUT - - -
//

// Login POST
app.post('/login', (req, res) => {
  console.log('login post req.body', req.body);
  const emailLogin = req.body.email; // from lecture
  const passwordLogin = req.body.password;
  // const foundUser = getUserByEmail(userGiven); // from lecture
  if (users[emaiLogin] && users[userGiven] === passwordGiven) {
    res.cookie('user_id',userGiven);
    res.redirect('/urls'); // TODO Profile does not exist
  } else {
    res.redirect("/");
  }
  // const foundUser = getUser(req.body.usermail); // from lecture
  // if (foundUser) {
  //   res.redirect('/?user_id=${foundUser.id');
  // } else {
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
  // const templateVars = {'usermail': null}
  res.render('register');
});

// REGISTER POST This should add new user object to the global user object
app.post('/register', (req, res) => {
  console.log('register req body: >>>', req.body);
  const newUsermail = req.body.email;
  const newPassword = req.body.password;
  
  if (newUsermail !== '' || newPassword !== '') {
    if (!emailExists(newUsermail)) {
    const genUser_id = generateRandomString(6);
    users[genUser_id] = {id: genUser_id, email: newUsermail, password: newPassword};
    console.log('🔥 Registers new users object: >>>', users);
    res.cookie('user_id', genUser_id);
    res.redirect('/urls');
    }
    res.statusCode(400);
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
  console.log('get urls/:shortURL  >>>', req.cookies['user_id']);
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    usermail: req.cookies['usermail'],
    user_id: req.cookies['user_id']
  };
  console.log(req.params.longURL)
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
  const templateVars = {
    urls: urlDatabase,
    usermail: req.cookies['usermail'],
    user_id: req.cookies['user_id']

   };
   // if (userID) { templateVars = { user: userID };};
  res.render('urls_index', templateVars);    // render urls_index with templateVars data/variables
});

// Create new tiny URLs
app.get('/urls/new', (req, res) => {
  const templateVars = { urls: urlDatabase };
  // if (genUser_id) { templateVars = { user: user_id };};
  res.render('urls_new', templateVars);           // urls_new really only contains an include of partial header
});                                 // so no need for templateVars




app.listen(PORT, () => {
  console.log(`tiny app listening on port ${PORT}!`);
});


// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });
