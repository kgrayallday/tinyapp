const express = require("express");
const app = express();
const PORT = 8080;

function generateRandomString(length = 6) {
  return Math.random().toString(16).substr(2, length);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.get('/', (req, res) => { // render /pages/index when root is visited (NOT WORKING)
  console.log('Cookies: ', req.cookies)
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
   };
  res.render('./pages/index', templateVars);
});

// Login POST
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

// Delete POST /urls/:shortURL/delete
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  console.log('short url passed after delete click', shortURL);
  delete urlDatabase[shortURL];
  res.redirect('/urls'); // on Delete("Destroy") redirects back to url index
});

// Update a URL with POST
app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.longURL; // NEED TO FIX THIS ID IS NOT A PROPERTY OF PARAMS
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

// Add a new url with POST 
app.post("/urls", (req, res) => {
  console.log(req.body);                                // Log the POST request body to the console when visiting 8080/urls
  const randId = generateRandomString();
  urlDatabase[randId] = req.body.longURL; // insert new shortURL : longURL key-value pairs to our urlDatabase obj
  res.redirect(`/urls/${randId}`);                    // redirect to specific shortURL key site
});

app.get("/u/:shortURL", (req, res) => {              // takes the shortURL link request
  const longURL = urlDatabase[req.params.shortURL];  // and links to the actual(longURL) by referencing 
  res.redirect(longURL);                             // the urlDatabase variables based on the :shortURL passed
});



app.get('/urls', (req, res) => {
  // console.log('username tmpVars from get /urls', res.cookies["username"]);
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
   };
  res.render('urls_index', templateVars);    // render urls_index with templateVars data/variables
});

// Create new tiny URLs
app.get('/urls/new', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
   };
  res.render('urls_new', templateVars);           // urls_new really only contains an include of partial header
});                                 // so no need for templateVars

// brings us to each urls specific page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  console.log(req.params.longURL)
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`tiny app listening on port ${PORT}!`);
});


// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });
