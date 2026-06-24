"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseAdmin = getSupabaseAdmin;
const supabase_js_1 = require("@supabase/supabase-js");
let _client = null;
function getSupabaseUrl() {
    const url = process.env.SUPABASE_URL;
    if (!url)
        throw new Error('SUPABASE_URL env var not set');
    return url;
}
function getSupabaseKey() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key)
        throw new Error('SUPABASE_SERVICE_ROLE_KEY env var not set');
    return key;
}
function getSupabaseAdmin() {
    if (!_client) {
        _client = (0, supabase_js_1.createClient)(getSupabaseUrl(), getSupabaseKey());
    }
    return _client;
}
//# sourceMappingURL=supabase-admin.js.map