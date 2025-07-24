const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.DATABASE_URL, process.env.DATABASE_KEY)

module.exports = supabase;