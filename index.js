const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./models/User");
const cors = require("cors");

// Подключаем CORS middleware

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Подключено к MongoDB"))
  .catch((err) => console.error("Ошибка подключения к MongoDB:", err));

app.get("/", (req, res) => {
  res.send("aa");
});
app.post("/register", async (req, res) => {
  const { username, password, tel } = req.body;
  let randomId = () => {
    return Math.random();
  };
  let id = randomId();
  // Проверка наличия имени пользователя
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "Пользователь уже существует", status: "danger", id });
  }

  // Хеширование пароля
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создание нового пользователя
  const newUser = new User({ username, password: hashedPassword, tel });
  await newUser.save();

  res.json({
    userData: newUser,
    meta: { message: "Регистрация успешна", status: "success", id },
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(username);

  // Проверка наличия пользователя
  const user = await User.findOne({ username });
  let randomId = () => {
    return Math.random();
  };
  let id = randomId();
  if (!user) {
    return res.status(400).json({
      message: "Неверное имя пользователя",
      status: "danger",
      id: id,
    });
  }

  // Проверка пароля
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({
      message: "Неверный пароль",
      status: "danger",
      id: id,
    });
  }

  // Генерация JWT токена
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
    expiresIn: "24h",
  });

  res.json({
    _id: user._id,
    username: user.username,
    films: user.films,
    token,
  });
});

app.get("/users", async (req, res) => {
  const { user } = req.query;
  if (!user) {
    const users = await User.find();
    console.log(users);
    res.json({ data: users, message: "все юзеры " });
    return;
  }

  const existingUser = await User.findOne({ username: user });

  if (!existingUser) {
    return res.status(400).json({ message: "Нету такого" });
  }

  res.json({ data: existingUser, message: "Регистрация успешна" });
});

app.put("/users/:id/add-film", async (req, res) => {
  try {
    let randomId = () => {
      return Math.random();
    };
    let id = randomId();
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { films: { $each: [req.body.films[0]], $position: 0 } } }, // Добавляем новый элемент в массив
      { new: true }
    );
    res.json({
      userData: updatedUser,
      meta: {
        message: "Фильм сохранён",
        status: "success",
        id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.put("/users/:id/remove-film", async (req, res) => {
  try {
    let randomId = () => {
      return Math.random();
    };
    let id = randomId();
    console.log(req.body.films);
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { films: req.body.films[0] } }, // Удаляем элемент из массива
      { new: true }
    );
    res.json({
      userData: updatedUser,
      meta: {
        message: "Фильм удален",
        status: "danger",
        id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// const deleteAllUsers = async () => {
//   try {
//     // Удаление всех документов в коллекции User
//     const result = await User.deleteMany({});
//     console.log(`Удалено пользователей: ${result.deletedCount}`);
//   } catch (error) {
//     console.error("Ошибка при удалении пользователей:", error.message);
//   }
// };

// deleteAllUsers();
app.listen(PORT);
