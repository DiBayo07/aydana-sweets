// routes/orders.js
const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../db');

// GET все заказы
router.get('/', async (req, res) => {
  try {
    const orders = await readData('orders.json');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST создать заказ
router.post('/', async (req, res) => {
  try {
    const orders = await readData('orders.json');
    const newOrder = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      ...req.body,
      status: 'new'
    };
    orders.unshift(newOrder);
    await writeData('orders.json', orders);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT обновить статус заказа
router.put('/:id/status', async (req, res) => {
  try {
    const orders = await readData('orders.json');
    const index = orders.findIndex(o => o.id == req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    orders[index].status = req.body.status;
    await writeData('orders.json', orders);
    res.json(orders[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE удалить заказ
router.delete('/:id', async (req, res) => {
  try {
    const orders = await readData('orders.json');
    const filtered = orders.filter(o => o.id != req.params.id);
    await writeData('orders.json', filtered);
    res.json({ message: 'Заказ удалён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;