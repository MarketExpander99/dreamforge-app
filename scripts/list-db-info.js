const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY.replace(/[\/\+=]/