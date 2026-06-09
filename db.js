// db.js - Файловое хранилище вместо базы данных
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Убедимся, что папка data существует
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Чтение данных из JSON файла
async function readData(filename) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Если файла нет, возвращаем пустой массив
    return [];
  }
}

// Запись данных в JSON файл
async function writeData(filename, data) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return true;
}

// Инициализация начальных данных
async function initializeData() {
  const products = await readData('products.json');
  if (products.length === 0) {
    const initialProducts = [
      { id: 1, name: "Молочный шоколад с орехами", brand: "milka", brandName: "Milka", type: "milk", cacao: 30, flavor: "hazelnut", category: "bar", price: 350, description: "Нежный молочный шоколад с цельным фундуком", emoji: "🌰", image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=200", tags: ["хит"], country: "germany" },
      { id: 2, name: "Тёмный шоколад 72% какао", brand: "lindt", brandName: "Lindt", type: "dark", cacao: 72, flavor: "classic", category: "bar", price: 480, description: "Интенсивный тёмный шоколад с нотками красных фруктов", emoji: "🍫", image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=200", tags: ["хит"], country: "switzerland" },
      { id: 3, name: "Белый шоколад с ягодами", brand: "milka", brandName: "Milka", type: "white", cacao: 0, flavor: "berry", category: "bar", price: 380, description: "Кремовый белый шоколад с кислинкой ягод", emoji: "🍓", image: "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=200", tags: [], country: "germany" },
      { id: 4, name: "Шоколадная паста с фундуком", brand: "nutella", brandName: "Nutella", type: "hazelnut", cacao: 13, flavor: "hazelnut", category: "sets", price: 590, description: "Нежная паста с кусочками фундука", emoji: "🥜", image: "https://images.unsplash.com/photo-1541783245831-57f6fb74c9e6?w=200", tags: [], country: "italy" }
    ];
    await writeData('products.json', initialProducts);
  }
  
  const brands = await readData('brands.json');
  if (brands.length === 0) {
    const initialBrands = [
      { id: "milka", name: "Milka", country: "germany", countryName: "Германия", logo: "🐄", founded: 1901, description: "Знаменитый альпийский молочный шоколад" },
      { id: "lindt", name: "Lindt", country: "switzerland", countryName: "Швейцария", logo: "🍫", founded: 1845, description: "Премиальный швейцарский шоколад" },
      { id: "nutella", name: "Nutella", country: "italy", countryName: "Италия", logo: "🍫", founded: 1964, description: "Всемирно известная шоколадная паста" }
    ];
    await writeData('brands.json', initialBrands);
  }
  
  const orders = await readData('orders.json');
  if (orders.length === 0) {
    await writeData('orders.json', []);
  }
}

module.exports = {
  readData,
  writeData,
  initializeData
};