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

app.get("/", (req, res) => { // render /pages/index when root is visited
  res.render('/pages/index');
});

// Delete POST /urls/:shortUrl/delete
app.post("/urls/:shortUrl/delete", (req, res) => {
  const shortUrl = req.params.shortUrl;
  console.log('short url passed after delete click', shortUrl);
  delete urlDatabase[shortUrl];
  res.redirect('/urls'); // on Delete("Destroy") redirects back to url index
});

app.get("/u/:shortURL", (req, res) => {              // takes the shortUrl link request
  const longURL = urlDatabase[req.params.shortURL];  // and links to the actual(longUrl) by referencing 
  res.redirect(longURL);                             // the urlDatabase variables based on the :shortUrl passed
});

// Add a url with POST 
app.post("/urls", (req, res) => {
  console.log(req.body);                                // Log the POST request body to the console when visiting 8080/urls
  urlDatabase.res.params.shortURL = res.params.longURL; // insert new shortUrl : longUrl key-value pairs to our urlDatabase obj
  res.redirect(`/urls/${shortURL}`);                    // redirect to specific shorturl key site
});

app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase }; // passing the object as is so we can iterate through keys later
  res.render('urls_index', templateVars);    // render urls_index with templateVars data/variables
  const urls = [
    { "b2xVn2": "http://www.lighthouselabs.ca"},
    {"9sm5xK": "http://www.google.com"}
  ];
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');           // urls_new really only contains an include of partial header
});                                 // so no need for templateVars

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: req.params.longURL};
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`tiny app listening on port ${PORT}!`);
});


// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });