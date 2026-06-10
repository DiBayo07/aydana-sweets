// Supabase клиент для Айдана Sweets

function getSupabase() {
    if (!window._supabaseClient) {
        if (!window.supabase) throw new Error('Supabase CDN не загружен');
        window._supabaseClient = window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY
        );
    }
    return window._supabaseClient;
}

function mapProduct(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        brand: row.brand,
        brandName: row.brand_name || row.brand,
        type: row.type || 'milk',
        cacao: row.cacao ?? 0,
        flavor: row.flavor || 'classic',
        category: row.category || 'bar',
        price: row.price,
        description: row.description || '',
        image: row.image || 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=200',
        tags: row.tags || [],
        country: row.country || ''
    };
}

function productToRow(p) {
    return {
        name: p.name,
        brand: p.brand,
        brand_name: p.brandName || p.brand,
        type: p.type,
        cacao: p.cacao ?? 0,
        flavor: p.flavor || 'classic',
        category: p.category || 'bar',
        price: p.price,
        description: p.description || '',
        image: p.image || '',
        tags: p.tags || [],
        country: p.country || ''
    };
}

function formatSupabaseError(error) {
    if (!error) return 'Unknown Supabase error';
    if (error.code === '42P01') {
        return 'В Supabase не найдена таблица. Выполните SQL schema.sql в SQL Editor.';
    }
    if (error.code === '42501') {
        return 'Ошибка прав доступа Supabase (RLS/policies). Проверьте политики для anon key.';
    }
    return error.message || 'Ошибка Supabase';
}

window.fetchProducts = async function fetchProducts() {
    const { data, error } = await getSupabase()
        .from('products')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Supabase products:', error);
        throw new Error(formatSupabaseError(error));
    }
    return (data || []).map(mapProduct);
};

window.saveProduct = async function saveProduct(p) {
    const row = productToRow(p);
    if (p.id) {
        const { data, error } = await getSupabase()
            .from('products')
            .update(row)
            .eq('id', p.id)
            .select()
            .single();
        if (error) throw new Error(formatSupabaseError(error));
        return mapProduct(data);
    }
    const { data, error } = await getSupabase()
        .from('products')
        .insert(row)
        .select()
        .single();
    if (error) throw new Error(formatSupabaseError(error));
    return mapProduct(data);
};

window.removeProduct = async function removeProduct(id) {
    const { error } = await getSupabase().from('products').delete().eq('id', id);
    if (error) throw new Error(formatSupabaseError(error));
};

window.saveOrder = async function saveOrder(order) {
    const { error } = await getSupabase().from('orders').insert({
        id: order.id || Math.floor(Math.random() * 1000000000),
        customer: order.customer,
        phone: order.phone,
        address: order.address,
        payment: order.payment,
        items: order.items,
        total: order.total,
        status: 'new'
    });
    if (error) throw new Error(formatSupabaseError(error));
};

// ===== СООБЩЕНИЯ (ИСПРАВЛЕНО) =====
window.saveMessage = async function saveMessage(payload) {
    console.log('📝 saveMessage вызвана:', payload);
    
    const { data, error } = await getSupabase().from('messages').insert({
        name: payload.name,
        email: payload.email,
        message: payload.message,
        created_at: new Date().toISOString()
    }).select();
    
    if (error) {
        console.error('❌ Ошибка Supabase:', error);
        throw new Error(formatSupabaseError(error));
    }
    
    console.log('✅ Сообщение сохранено:', data);
    return data;
};

window.fetchMessages = async function fetchMessages() {
    console.log('📋 fetchMessages вызвана');
    
    const { data, error } = await getSupabase()
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
        throw new Error(formatSupabaseError(error));
    }
    
    console.log('✅ Загружено сообщений:', data?.length || 0);
    return data || [];
};