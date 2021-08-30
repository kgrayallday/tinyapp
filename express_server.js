const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  res.render('/pages/index');
});

app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase };
  res.render('urls_index', templateVars);
  const urls = [
    { "b2xVn2": "http://www.lighthouselabs.ca"},
    {"9sm5xK": "http://www.google.com"}
  ];
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });