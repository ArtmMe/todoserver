const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(port || 3000, () => {
  console.log('✅ server is running on ' + port)
})

module.exports = app;