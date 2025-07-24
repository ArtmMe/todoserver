const express = require('express');
const { getAll, createTask, getTodo, deleteTodo, updateTodo } = require('../controllers/todoControllers');
const router = express.Router();


router.get('/', getAll);
router.get('/:id', getTodo);
router.delete('/:id', deleteTodo);
router.patch('/:id', updateTodo);
router.post('/', createTask);

module.exports = router;