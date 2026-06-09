// routes/products.js
const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../db');

// GET все товары
router.get('/', async (req, res) => {
  try {
    const products = await readData('products.json');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET один товар по ID
router.get('/:id', async (req, res) => {
  try {
    const products = await readData('products.json');
    const product = products.find(p => p.id == req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST добавить товар
router.post('/', async (req, res) => {
  try {
    const products = await readData('products.json');
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = { id: newId, ...req.body };
    products.push(newProduct);
    await writeData('products.json', products);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT обновить товар
router.put('/:id', async (req, res) => {
  try {
    const products = await readData('products.json');
    const index = products.findIndex(p => p.id == req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    products[index] = { ...products[index], ...req.body, id: products[index].id };
    await writeData('products.json', products);
    res.json(products[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE удалить товар
router.delete('/:id', async (req, res) => {
  try {
    const products = await readData('products.json');
    const filtered = products.filter(p => p.id != req.params.id);
    await writeData('products.json', filtered);
    res.json({ message: 'Товар удалён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;