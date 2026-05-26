window.saveMessage = async function saveMessage(payload) {
    console.log('saveMessage вызван:', payload);
    
    // Используем ТОТ ЖЕ клиент, что и для товаров
    const supabase = getSupabase();
    
    const { data, error } = await supabase
        .from('messages')
        .insert([
            {
                name: payload.name,
                email: payload.email,
                message: payload.message,
                created_at: new Date().toISOString()
            }
        ])
        .select();
    
    if (error) {
        console.error('Ошибка Supabase:', error);
        throw new Error(formatSupabaseError(error));
    }
    
    console.log('Сообщение сохранено:', data);
    return data;
};
