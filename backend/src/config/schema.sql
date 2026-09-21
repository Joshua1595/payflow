CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer'
        CHECK (role IN ('customer', 'merchant', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00
        CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'frozen', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL
        CHECK (
            type IN (
                'deposit',
                'withdrawal',
                'transfer',
                'payment',
                'refund'
            )
        ),
    amount NUMERIC(18, 2) NOT NULL
        CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled',
                'refunded'
            )
        ),
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT
);
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    entry_type VARCHAR(10) NOT NULL
        CHECK (entry_type IN ('debit', 'credit')),
    amount NUMERIC(18, 2) NOT NULL
        CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT
);
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    business_name VARCHAR(150) NOT NULL,
    business_email VARCHAR(150) UNIQUE NOT NULL,
    business_phone VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_merchant_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    amount NUMERIC(18, 2) NOT NULL
        CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status VARCHAR(20) NOT NULL DEFAULT 'created'
        CHECK (
            status IN (
                'created',
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled',
                'refunded'
            )
        ),
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_merchant
        FOREIGN KEY (merchant_id)
        REFERENCES merchants(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_payment_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL
        CHECK (
            type IN (
                'card',
                'bank_account',
                'mobile_money',
                'wallet'
            )
        ),
    provider VARCHAR(50),
    provider_method_id VARCHAR(150),
    last4 VARCHAR(4),
    brand VARCHAR(30),
    is_default BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (
            status IN ('active', 'inactive')
        ),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_method_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_provider_method
        UNIQUE (provider, provider_method_id)
);
CREATE TABLE payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    payment_method_id UUID,
    provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(150),
    attempt_number INTEGER NOT NULL DEFAULT 1
        CHECK (attempt_number > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'successful',
                'failed',
                'cancelled'
            )
        ),
    amount NUMERIC(18, 2) NOT NULL
        CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    error_code VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempt_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_attempt_method
        FOREIGN KEY (payment_method_id)
        REFERENCES payment_methods(id)
        ON DELETE SET NULL,
    CONSTRAINT uq_payment_attempt
        UNIQUE (payment_id, attempt_number)
);
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    amount NUMERIC(18, 2) NOT NULL
        CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled'
            )
        ),
    reference VARCHAR(100) UNIQUE NOT NULL,
    provider_refund_id VARCHAR(150),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refund_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE RESTRICT
);
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(150) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payment_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'received'
        CHECK (
            status IN (
                'received',
                'processing',
                'processed',
                'failed'
            )
        ),
    payload JSONB NOT NULL,
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_webhook_event
        UNIQUE (provider, event_id),
    CONSTRAINT fk_webhook_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE SET NULL
);
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    idempotency_key VARCHAR(150) NOT NULL,
    request_path VARCHAR(255) NOT NULL,
    request_method VARCHAR(10) NOT NULL,
    request_hash TEXT,
    response_status INTEGER,
    response_body JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'processing'
        CHECK (
            status IN (
                'processing',
                'completed',
                'failed'
            )
        ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_idempotency_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_user_idempotency
        UNIQUE (user_id, idempotency_key)
);
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);
CREATE TABLE merchant_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL UNIQUE,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    settlement_currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    available_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00
        CHECK (available_balance >= 0),
    pending_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00
        CHECK (pending_balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'frozen',
                'closed'
            )
        ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_merchant_account_merchant
        FOREIGN KEY (merchant_id)
        REFERENCES merchants(id)
        ON DELETE RESTRICT
);
CREATE TABLE wallet_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    sender_wallet_id UUID NOT NULL,
    receiver_wallet_id UUID NOT NULL,
    amount NUMERIC(18, 2) NOT NULL
        CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled'
            )
        ),
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transfer_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_sender
        FOREIGN KEY (sender_wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_receiver
        FOREIGN KEY (receiver_wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_different_wallets
        CHECK (sender_wallet_id <> receiver_wallet_id)
);
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL
        REFERENCES merchants(id)
        ON DELETE RESTRICT,
    merchant_account_id UUID NOT NULL
        REFERENCES merchant_accounts(id)
        ON DELETE RESTRICT,
    amount NUMERIC(18,2) NOT NULL
        CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled'
            )
        ),

    reference VARCHAR(100) NOT NULL UNIQUE,
    failure_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);