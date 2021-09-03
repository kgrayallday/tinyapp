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

module.exports = { getUserByEmail, urlExists };