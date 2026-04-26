-- 3. Tabel Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL CHECK(action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'UPLOAD', 'LOGIN')),
    resource TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
