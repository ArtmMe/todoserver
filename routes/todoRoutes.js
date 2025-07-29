const express = require('express');
const { getAll, createTask, getTodo, deleteTodo, updateTodo, cancelDeletion } = require('../controllers/todoControllers');
const router = express.Router();


router.get('/', getAll);
router.get('/:id', getTodo);
router.delete('/:id', deleteTodo);
router.put('/:id', updateTodo);
router.post('/', createTask);
router.post('/:id', cancelDeletion)

module.exports = router;