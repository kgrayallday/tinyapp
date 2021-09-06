const getUserByEmail = (email, database) => {
  for (let id in database) {
    if (email === database[id].email){
      const user = database[id];
      return user;
    }
  }
  return false;
}

const urlExists = (shortURL, database) => {
  for (let url in database) {
    if (url === shortURL) {
      return true;
    }  
  }
  return false;
};

const isUserLoggedIn = (req, users) => {
  if (users[req.session.user_id] === undefined) {
    return false;
  }
  return true;
}

const generateRandomString = (length = 6) => {
  return Math.random().toString(16).substr(2, length);
}

// const user = users[req.session.user_id];
// const templateVars = {
//   urls: urlDatabase,
//   userID: req.session.user_id,
//   user: user
// };

module.exports = { getUserByEmail, urlExists, isUserLoggedIn, generateRandomString };