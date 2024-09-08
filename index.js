const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();
const app = express();
app.use(express.json());

const PORT = 8080;

mongoose
  .connect(
    "mongodb+srv://laraptxe:VgaqT9nablA8DrRC@cluster0.17vxo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("Подключено к MongoDB"))
  .catch((err) => console.error("Ошибка подключения к MongoDB:", err));

app.get("/", (req, res) => {
  res.send("aa");
});
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Проверка наличия имени пользователя
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: "Пользователь уже существует" });
  }

  // Хеширование пароля
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создание нового пользователя
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();

  res.json({ message: "Регистрация успешна" });
});
app.get("/users", async (req, res) => {
  const { user } = req.query;
  console.log(user);
  const existingUser = await User.findOne({ username: user });
  console.log(existingUser);
  if (!existingUser) {
    return res.status(400).json({ message: "Нету такого" });
  }

  res.json({ data: existingUser, message: "Регистрация успешна" });
});
app.listen(PORT);
