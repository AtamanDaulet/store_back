const bcrypt = require("bcrypt");

const saltRounds = 10;

exports.genHashPassword = async (password) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt)
};

exports.comparePassword = async (password, hashPassword) => {
  return await bcrypt.compare(password, hashPassword);
}