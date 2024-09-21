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
  const user = new User({ username, password: hashedPassword, tel });
  await user.save();
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, {});
  res.json({
    userData: {
      _id: user._id,
      username: user.username,
      films: user.films,
      token,
    },
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
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, {});

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
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      meta: {
        message: "Нет токена",
        status: "danger",
        id,
      },
    });
  }
  try {
    let randomId = () => {
      return Math.random();
    };
    let id = randomId();
    jwt.verify(token, JWT_SECRET);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { films: { $each: [req.body.films[0]], $position: 0 } } }, // Добавляем новый элемент в массив
      { new: true }
    );
    res.json({
      userData: {
        _id: updatedUser._id,
        username: updatedUser.username,
        tel: updatedUser.tel,
        films: updatedUser.films,
        token,
      },
      meta: {
        message: "Фильм сохранён",
        status: "success",
        id,
      },
    });
  } catch (error) {
    res.status(500).json({
      meta: {
        message: "Неверный токен",
        status: "danger",
        id,
      },
    });
  }
});
app.put("/users/:id/remove-film", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Нет токена, авторизация отклонена" });
    }
    jwt.verify(token, JWT_SECRET);
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
      userData: {
        _id: updatedUser._id,
        username: updatedUser.username,
        tel: updatedUser.tel,
        films: updatedUser.films,
        token,
      },
      meta: {
        message: "Фильм удален",
        status: "danger",
        id,
      },
    });
  } catch (error) {
    res.status(500).json({
      meta: {
        message: "Неверный токен",
        status: "danger",
        id,
      },
    });
  }
});

app.get("/protected", (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Нет токена, авторизация отклонена" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: "Доступ разрешен", userId: decoded.userId });
  } catch (err) {
    return res.status(401).json({ message: "Неверный токен" });
  }
});

// const deleteAllUsers = async () => {
//   try {
//     // Удаление всех документов в коллекции User
//     const result = await User.deleteMany({ username: "Ррол" });
//     console.log(`Удалено пользователей: ${result.deletedCount}`);
//   } catch (error) {
//     console.error("Ошибка при удалении пользователей:", error.message);
//   }
// };

// deleteAllUsers();
app.listen(PORT);
