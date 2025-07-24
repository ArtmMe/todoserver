const supabase = require('../db/db');
const createUser = async (req, res) => {
  const {login} = req.body;

  const { data } = await supabase.from('User').select('login').eq('login', login);
  if (data.length <= 0) {
    await supabase.from('User').insert({login});
    return res.status(201).json({message: 'Пользователь создан'});
  }
  return res.status(200).json({message: 'Пользователь уже создан'});
}

module.exports = {createUser}