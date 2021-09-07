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

const renderError = (resCode, customMsg, res) => {
  const errors = {
    '400': '400 Bad Request',
    '401': '401 Unauthorized',
    '403': '403 Forbidden',
    '404': '404 Not Found'
  }
  
  const templateVars = {
    resCode: resCode,
    errors: errors[resCode],
    customMsg: customMsg
  };

  res.render('error', templateVars);
};

module.exports = { getUserByEmail, urlExists, isUserLoggedIn, generateRandomString, renderError };