const supabase = require('../db/db');
const pendingDeletions = new Map();
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
  const userID = req.cookies.id;
  const { data, error } = await supabase
    .from('Todo')
    .select(`*, Status!inner(*), Category!inner(*), Priority!inner(*)`)
    .eq('user_id', userID)
    .order('id', { ascending: true });
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
  const userID = req.cookies.id;
  const {data} = await supabase
    .from('Todo')
    .select(`*,  Status!inner(*), Category!inner(*), Priority!inner(*)`)
    .eq('id', id)
    .eq('user_id', userID)
    .single();
  if (!data) {
    return res.status(200).json(null);
  }
  return res.status(200).json(formatTodo(data));
}


const createTask = async (req, res) => {
  const userID = req.cookies.id;
  const {title, description, status, priority, category} = req.body;
  if (!title) {
    return res.status(404).json({message: 'Заголовок не найден'});
  }
  const { data: IDData, error: IDError } = await supabase
  .rpc('get_ids', {
    p_user_id: userID,
    p_category_name: category,
    p_status_name: status,
    p_priority_name: priority
  }).single();

  if (IDError) {
    return res.status(500).json({messaage: 'Что-то пошло не так'})
  }
    
  const {data: newTodo, error} = await supabase.from('Todo').insert({
    title, 
    description, 
    user_id: IDData.user_id, 
    category_id: IDData.category_id, 
    status_id: IDData.status_id, 
    priority_id: IDData.priority_id
  }).select(`
    id, 
    title, 
    description, 
    created_at,
    Status:status_id(name), 
    Category:category_id(name), 
    Priority:priority_id(name)
  `).single();
  if (error) {
    return res.status(500).json({message: error});
  }
  res.status(201).json(formatTodo(newTodo));
}

const deleteTodo = async (req, res) => {
  const {id} = req.params;
  const userID = req.cookies.id;

  const {data: todoCheck} = await supabase
    .from('Todo')
    .select(`id`)
    .eq('id', id)
    .eq('user_id', userID)
    .single();
  if (!todoCheck) {
    return res.status(403).json({message: 'Задача не найдена'});
  }

  if (pendingDeletions.has(id)) {
    clearTimeout(pendingDeletions.get(id));
  }

  const timeoutId = setTimeout(async () => {
    const {error} = await supabase
      .from('Todo')
      .delete()
      .eq('id', id);
      
    pendingDeletions.delete(id);
    
  }, 5000);

  pendingDeletions.set(id, timeoutId);
  
  return res.status(200).json({message: 'Задача будет удалена через 5 секунд'});
}

const cancelDeletion = async (req, res) => {
  const {id} = req.params;
  const userID = req.cookies.id;
  
  if (!pendingDeletions.has(id)) {
    return res.status(404).json({message: 'Отложенное удаление не найдено'});
  }
  
  const {data: todoCheck} = await supabase
    .from('Todo')
    .select(`id`)
    .eq('id', id)
    .eq('user_id', userID)
    .single();
  
  if (!todoCheck) {
    return res.status(403).json({message: 'Задача не найдена'});
  }
  
  clearTimeout(pendingDeletions.get(id));
  pendingDeletions.delete(id);
  
  return res.status(200).json({message: 'Удаление отменено'});
};
const updateTodo = async (req, res) => {
  const { id } = req.params;
  const { title, description, category, status, priority } = req.body;
  const userID = req.cookies.id;
  
  
  const { data: todoCheck } = await supabase
    .from('Todo')
    .select(`id`)
    .eq('id', id)
    .eq('user_id', userID)
    .single();
    
  if (!todoCheck) {
    return res.status(403).json({ message: 'Задача не найдена' });
  }

  const { data: IDData, error: IDError } = await supabase
  .rpc('get_ids', {
    p_user_id: userID,
    p_category_name: category,
    p_status_name: status,
    p_priority_name: priority
  }).single();

  if (IDError) {
    return res.status(500).json({messaage: 'Что-то пошло не так'})
  }

  
  const { data: updatedTodo, error: updateError } = await supabase
    .from('Todo')
    .update({
      title,
      description,
      category_id: IDData.category_id,
      status_id: IDData.status_id,
      priority_id: IDData.priority_id
    })
    .eq('id', id)
    .select(`
      id, 
      title, 
      description, 
      created_at,
      Status:status_id(name), 
      Category:category_id(name), 
      Priority:priority_id(name)
    `)
    .single();;
    
  if (updateError) {
    return res.status(500).json({ message: 'Что-то пошло не так' });
  }
  
  return res.status(200).json(formatTodo(updatedTodo));
};

module.exports = { getAll, createTask, getTodo, deleteTodo, updateTodo, cancelDeletion };