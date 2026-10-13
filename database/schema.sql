CREATE DATABASE IF NOT EXISTS stockroom
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE stockroom;

-- Define incoming receipt records.
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(32) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  received_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_orders_received_at (received_at)
) ENGINE=InnoDB;

-- Define catalog products.
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(32) NOT NULL,
  order_id VARCHAR(32) NOT NULL,
  serial_number VARCHAR(64) NOT NULL,
  title VARCHAR(180) NOT NULL,
  product_type VARCHAR(80) NOT NULL,
  specification VARCHAR(255) NOT NULL,
  is_new BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('available', 'in_repair') NOT NULL DEFAULT 'available',
  guarantee_start DATE NOT NULL,
  guarantee_end DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_serial_number (serial_number),
  INDEX idx_products_order_id (order_id),
  INDEX idx_products_type (product_type),
  CONSTRAINT fk_products_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_products_guarantee_range
    CHECK (guarantee_end >= guarantee_start)
) ENGINE=InnoDB;

-- Store each supported currency.
CREATE TABLE IF NOT EXISTS product_prices (
  product_id VARCHAR(32) NOT NULL,
  currency CHAR(3) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (product_id, currency),
  CONSTRAINT fk_product_prices_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_product_prices_amount CHECK (amount >= 0)
) ENGINE=InnoDB;
