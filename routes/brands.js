// routes/brands.js
const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../db');

// GET все бренды
router.get('/', async (req, res) => {
  try {
    const brands = await readData('brands.json');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST добавить бренд
router.post('/', async (req, res) => {
  try {
    const brands = await readData('brands.json');
    const newBrand = req.body;
    brands.push(newBrand);
    await writeData('brands.json', brands);
    res.status(201).json(newBrand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE удалить бренд
router.delete('/:id', async (req, res) => {
  try {
    const brands = await readData('brands.json');
    const filtered = brands.filter(b => b.id !== req.params.id);
    await writeData('brands.json', filtered);
    res.json({ message: 'Бренд удалён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;