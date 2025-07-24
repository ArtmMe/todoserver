const supabase = require('../db/db');
const formatTodo = (todo) => ({
  id: todo.id,
  title: todo.title,
  description: todo.description,
  created_at: todo.created_at,
  status: todo.Status.name,
  category: todo.Category.name,
  priority: todo.Priority.name
})
const getAll = async (req, res) => {
  const { login } = req.body;
  const { data, error } = await supabase
    .from('Todo')
    .select(`*, User!inner(*), Status!inner(*), Category!inner(*), Priority!inner(*)`)
    .eq('User.login', login);
  if (error) {
    return res.status(500).json({message: error});
  }
  if (data.length <= 0) {
    return res.status(200).json(data);
  }
  const formattedData = data.map(formatTodo)
  return res.status(200).json(formattedData);
}

const getTodo = async (req, res) => {
  const {id} = req.params;
  const {login} = req.body;
  const {data} = await supabase
    .from('Todo')
    .select(`*, User!inner(*), Status!inner(*), Category!inner(*), Priority!inner(*)`)
    .eq('id', id)
    .eq('User.login', login)
    .single();
  if (!data) {
    return res.status(200).json(null);
  }
  return res.status(200).json(formatTodo(data));
}


const createTask = async (req, res) => {
  const {login, title, description, status, priority, category} = req.body;
  if (!title) {
    return res.status(404).json({message: 'Заголовок не найден'});
  }
  const [userResult, categoryResult, statusResult, priorityResult] = await Promise.all([
  supabase.from('User').select('id').eq('login', login).single(),
  supabase.from('Category').select('id').eq('name', category).single(),
  supabase.from('Status').select('id').eq('name', status).single(),
  supabase.from('Priority').select('id').eq('name', priority).single()
  ]);
    
  const errors = {
    user: userResult.error || !userResult.data ? 'Пользователь не найден' : null,
    category: categoryResult.error || !categoryResult.data ? 'Категория не найдена' : null,
    status: statusResult.error || !statusResult.data ? 'Статус не найден' : null,
    priority: priorityResult.error || !priorityResult.data ? 'Приоритет не найден' : null
  };
    
  const firstError = Object.values(errors).find(error => error !== null);
  if (firstError) return res.status(404).json({message: firstError});
    
  const {error} = await supabase.from('Todo').insert({
    title, 
    description, 
    user_id: userResult.data.id, 
    category_id: categoryResult.data.id, 
    status_id: statusResult.data.id, 
    priority_id: priorityResult.data.id
  });
  if (error) {
    return res.status(500).json({message: error});
  }
  res.status(201).json({message: 'Задача создана'});
}

const deleteTodo = async (req, res) => {
  const {id} = req.params;
  const {login} = req.body;

  const {data: todoCheck} = await supabase
    .from('Todo')
    .select(`id, User!inner(*)`)
    .eq('id', id)
    .eq('User.login', login)
    .single();
  if (!todoCheck) {
    return res.status(403).json({message: 'Задача не найдена'});
  }
  const {error} = await supabase
    .from('Todo')
    .delete()
    .eq('id', id);
  if (error) {
    return res.status(500).json({message: 'Что-то пошло не так'});
  }
  return res.status(200).json({message: 'Задача удалена'});
}
const updateTodo = async (req, res) => {
  const { id } = req.params;
  const { login, updateFields } = req.body;
  
  if (!updateFields) {
    return res.status(200).json({ message: 'Данные успешно обновлены' });
  }
  
  const { data: todoCheck } = await supabase
    .from('Todo')
    .select(`id, User!inner(*)`)
    .eq('id', id)
    .eq('User.login', login)
    .single();
    
  if (!todoCheck) {
    return res.status(403).json({ message: 'Задача не найдена' });
  }

  const filteredUpdate = {};
  
  const promises = [];
  
  if ('title' in updateFields) filteredUpdate.title = updateFields.title;
  if ('description' in updateFields) filteredUpdate.description = updateFields.description;
  
  const foreignKeyFields = [
    { key: 'category', table: 'Category', idField: 'category_id', errorMessage: 'Категория не найдена' },
    { key: 'status', table: 'Status', idField: 'status_id', errorMessage: 'Статус не найден' },
    { key: 'priority', table: 'Priority', idField: 'priority_id', errorMessage: 'Приоритет не найден' }
  ];
    
  for (const field of foreignKeyFields) {
    if (field.key in updateFields) {
      promises.push(
        (async () => {
          const { data, error } = await supabase
            .from(field.table)
            .select('id')
            .eq('name', updateFields[field.key])
            .single();
            
          if (error || !data) {
            throw { status: 404, message: field.errorMessage };
          }
          
          filteredUpdate[field.idField] = data.id;
        })()
      );
    }
  }
  await Promise.all(promises); 
  
  if (Object.keys(filteredUpdate).length <= 0) {
    return res.status(200).json({ message: 'Данные успешно обновлены' });
  }
  
  const { error } = await supabase
    .from('Todo')
    .update(filteredUpdate)
    .eq('id', id);
    
  if (error) {
    return res.status(500).json({ message: 'Что-то пошло не так' });
  }
  
  return res.status(200).json({ message: 'Данные успешно обновлены' });
};

module.exports = { getAll, createTask, getTodo, deleteTodo, updateTodo };