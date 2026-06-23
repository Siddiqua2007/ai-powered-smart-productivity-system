const express = require('express');
const router = express.Router();
const {
  createTask,
  getUserTasks,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createTask)
  .get(getUserTasks);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;