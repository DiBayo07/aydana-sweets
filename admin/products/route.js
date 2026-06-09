import { createClient } from '@supabase/supabase-js';

// Создаем специальный админ-клиент (только на сервере!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Секретный ключ
);

// ЭТОТ ОБРАБОТЧИК ДЛЯ ДОБАВЛЕНИЯ ТОВАРА (POST запрос)
export async function POST(request) {
  try {
    // 1. Получаем данные товара из запроса
    const product = await request.json();
    
    console.log('Получен товар:', product); // Для отладки
    
    // 2. Добавляем в базу данных
    const { data, error } = await supabaseAdmin
      .from('products')  // Название твоей таблицы
      .insert([{
        name: product.name,
        price: product.price,
        description: product.description,
        image_url: product.image_url,
        created_at: new Date()
      }])
      .select(); // Возвращаем добавленный товар
    
    // 3. Проверяем ошибки
    if (error) {
      console.error('Ошибка Supabase:', error);
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // 4. Успешный ответ
    return Response.json({ 
      success: true, 
      product: data[0] 
    });
    
  } catch (error) {
    console.error('Ошибка сервера:', error);
    return Response.json(
      { error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

// ЭТОТ ОБРАБОТЧИК ДЛЯ ПОЛУЧЕНИЯ ВСЕХ ТОВАРОВ (GET запрос)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return Response.json({ products: data });
    
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}