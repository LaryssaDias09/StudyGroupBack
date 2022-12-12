require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

const User = require("./models/User");
const Group = require("./models/Group");
const Task = require("./models/Task");

// file

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
});

app.post("/upload", upload.single("file"), async (req, res) => {
  console.log(`Files received: ${req.files.length}`);
  res.send({
    upload: true,
    files: req.files,
  });
});

app.get("/upload", async (req, res) => {
  try {
    const up = await upload.findAll();

    res.status(200).json(up);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Aconteceu um Error no Servidor. Tente novemente mais tarde!",
    });
  }
});

// Rotas TodoList

app.post("/Task", async (req, res) => {
  const { name } = req.body;

  const task = new Task({
    name,
  });

  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório!" });
  }
  try {
    await task.save();

    res.status(201).json({
      msg: "Grupo Criado com sucesso!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Aconteceu um Error no Servidor. Tente novemente mais tarde!",
    });
  }
});

app.get("/Task", async (req, res) => {
  try {
    const tasks = await Task.find();

    res.status(200).json(tasks);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Aconteceu um Error no Servidor. Tente novemente mais tarde!",
    });
  }
});

app.delete("/Task/:id", async (req, res) => {
  const id = req.params.id;

  const task = await Task.findOne({ _id: id });

  if (!task) {
    res.status(422).json({ message: "Usuário não encontrado!" });
    return;
  }

  try {
    await Task.deleteOne({ _id: id });

    res.status(200).json({ message: "Usuário removido com sucesso!" });
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

//Rota groups

app.post("/group", async (req, res) => {
  const { name, descricao } = req.body;

  const group = new Group({
    name,
    descricao,
  });

  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório!" });
  }
  try {
    await group.save();

    res.status(201).json({
      msg: "Grupo Criado com sucesso!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Aconteceu um Error no Servidor. Tente novemente mais tarde!",
    });
  }
});

app.get("/group", async (req, res) => {
  try {
    const groups = await Group.find();

    res.status(200).json(groups);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Aconteceu um Error no Servidor. Tente novemente mais tarde!",
    });
  }
});

app.delete("/group/:id", async (req, res) => {
  const id = req.params.id;

  const group = await Group.findOne({ _id: id });

  if (!group) {
    res.status(422).json({ message: "Usuário não encontrado!" });
    return;
  }

  try {
    await Group.deleteOne({ _id: id });

    res.status(200).json({ message: "Usuário removido com sucesso!" });
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

app.get("/group/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const group = await Group.findOne({ _id: id });

    if (!group) {
      res.status(422).json({ message: "Usuário não encontrado!" });
      return;
    }

    res.status(200).json(person);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

// Rota publica
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Teste api" });
});

// Rota privada
app.get("/user/:id", checkToken, async (req, res) => {
  const id = req.params.id;

  const user = await User.findById(id, "-password");

  if (!user) {
    return res.status(404).json({ msg: "Usuário não foi encontrado" });
  }
  res.status(200).json({ user });
});

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Acesso negado!" });
  }

  try {
    const secret = process.env.SECRET;

    jwt.verify(token, secret);

    next();
  } catch (error) {
    res.status(400).json({ msg: "Token Inválido" });
  }
}

// Registrar Usuario
app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório!" });
  }

  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatório!" });
  }

  if (password !== confirmpassword) {
    return res.status(422).json({ msg: "As senhas  não batem" });
  }

  // verificar se usuario existe
  const userExist = await User.findOne({ email: email });

  if (userExist) {
    return res.status(422).json({ msg: "Por favor Utilizar Outro e-mail" });
  }

  // Senha
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Criar usuario
  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await user.save();

    res.status(201).json({
      msg: "Usuário Criado com sucesso!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Aconteceu um Error no Servidor. Tente novemente mais tarde!",
    });
  }
});

// Login Usuario

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatório!" });
  }

  // verificar se usuario está criado
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({ msg: "Email não encontrado!" });
  }

  // checar senha
  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha Invália!" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Aconteceu um Error no Servidor. Tente novemente mais tarde!",
    });
  }
});

// Credencias
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.xqe3uwr.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000);
    console.log("Conectou ao banco");
  })
  .catch((err) => {
    console.log(err);
  });
