const getUserByEmail = (email, database) => {
  for (let id in database) {
    if (email === database[id].email){
      const user = database[id];
      return user;
    }
  }
  return false;
}

module.exports = { getUserByEmail };