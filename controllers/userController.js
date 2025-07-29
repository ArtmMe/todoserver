const supabase = require('../db/db');
const cookieAge = 24*60*60*1000;
const createUser = async (req, res) => {
  const {login} = req.body;

  const { data: user } = await supabase.from('User').select('*').eq('login', login).single();
  if (!user) {
    const {data: newUser} = await supabase.from('User').insert({login}).select().single();
    console.log(newUser)
    res.cookie('id', newUser.id, {maxAge: cookieAge});
    res.cookie('login', newUser.login, {maxAge: cookieAge});
    return res.status(201).json({message: 'Пользователь создан'});
  }
  res.cookie('id', user.id, {maxAge: cookieAge, secure: true, sameSite: 'none'});
  res.cookie('login', user.login, {maxAge: cookieAge, secure: true, sameSite: 'none'});
  return res.status(200).json({message: 'Пользователь уже создан'});
}

module.exports = {createUser}