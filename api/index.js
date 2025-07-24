require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('../routes/userRoutes');
const todoRoutes = require('../routes/todoRoutes')
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use('/user', userRoutes)

const checkLogin = (req, res, next) => {
  if (!req.body || !req.body.login) {
    return res.status(401).json({message: 'Сначала нужно авторизоваться'});
  }
  next();
}
app.use('/todo', checkLogin, todoRoutes)
app.listen(port, () => {
  console.log('✅ server is running on ' + port)
})

module.exports = app;