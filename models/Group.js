const mongoose = require("mongoose");

const Group = mongoose.model("Group", {
  name: String,
  descricao: String,
});

module.exports = Group;
