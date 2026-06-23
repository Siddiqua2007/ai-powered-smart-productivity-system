const Task = require('../models/Task');

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, priority, category, deadline } = req.body;
    const newTask = new Task({
      title, description, priority, category, deadline,
      userId: req.user.id
    });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    next(err);
  }
};

exports.getUserTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to update this task" });
    }
    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to delete this task" });
    }
    await Task.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Task removed successfully" });
  } catch (err) {
    next(err);
  }
};