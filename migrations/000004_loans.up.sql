-- 4. Tabel Loans (Peminjaman Aset)
CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    borrower_name TEXT NOT NULL,
    borrower_contact TEXT DEFAULT '',
    loan_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'BORROWED' CHECK(status IN ('BORROWED', 'RETURNED', 'OVERDUE')),
    condition_at_loan TEXT DEFAULT '',
    condition_at_return TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    loaner_id TEXT DEFAULT 'anonymous',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX IF NOT EXISTS idx_loans_asset_id ON loans(asset_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
