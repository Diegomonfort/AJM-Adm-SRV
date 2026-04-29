import { supabase } from './src/config/supabase.js';

async function test() {
    console.log("Fetching relation...");
    const { data: prods, error: pErr } = await supabase.from('productos').select('Categoria, categorias(Nombre, index)').limit(1);
    console.log("Prods error:", pErr);
    console.log("Prods data:", JSON.stringify(prods));

    const { data: cats, error: cErr } = await supabase.from('categorias').select('*').limit(1);
    console.log("Cats error:", cErr);
    console.log("Cats data:", JSON.stringify(cats));
}
test();
