// admin.js - общие функции для работы с Supabase
// Важно: ключ берем из public/js/config.js (единый для всего проекта)

const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// Загрузка товаров
async function loadProductsFromSupabase() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id');
    
    if (error) {
        console.error('Ошибка загрузки товаров:', error);
        return [];
    }
    return data;
}

// Сообщения из формы "Контакты"
async function loadMessagesFromSupabase() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Ошибка загрузки сообщений:', error);
    return [];
  }
  return data || [];
}

// Сохранение товара
async function saveProductToSupabase(product) {
    if (product.id && product.id > 0) {
        // Обновление
        const { data, error } = await supabase
            .from('products')
            .update(product)
            .eq('id', product.id)
            .select();
        
        if (error) throw error;
        return data[0];
    } else {
        // Добавление
        const { data, error } = await supabase
            .from('products')
            .insert([product])
            .select();
        
        if (error) throw error;
        return data[0];
    }
}

// Удаление товара
async function deleteProductFromSupabase(id) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
    return true;
}

// Загрузка заказов
async function loadOrdersFromSupabase() {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Ошибка загрузки заказов:', error);
        return [];
    }
    return data;
}

// Обновление статуса заказа
async function updateOrderStatusInSupabase(id, status) {
    const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) throw error;
    return true;
}

// Удаление заказа
async function deleteOrderFromSupabase(id) {
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
    return true;
}

// Загрузка статистики
async function loadStatsFromSupabase() {
    const [products, orders] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true })
    ]);
    
    const { data: ordersData } = await supabase.from('orders').select('total');
    const revenue = ordersData ? ordersData.reduce((sum, o) => sum + (o.total || 0), 0) : 0;
    
    return {
        productsCount: products.count || 0,
        ordersCount: orders.count || 0,
        revenue: revenue
    };
}

// Загрузка брендов
async function loadBrandsFromSupabase() {
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Ошибка загрузки брендов:', error);
        return [];
    }
    return data;
}