require('dotenv').config();

module.exports = {
  mainUser: {
    username: process.env.MAIN_USER_USERNAME,
    password: process.env.USER_PASSWORD
  },
  secondaryUser: {
    username: process.env.SECONDARY_USER_USERNAME,
    password: process.env.USER_PASSWORD
  },
  aid: process.env.AID
};