-- Database Schema for app_db

CREATE DATABASE IF NOT EXISTS app_db;
USE app_db;

-- Drop existing tables in reverse dependency order for clean re-initialization
DROP TABLE IF EXISTS claim_items;
DROP TABLE IF EXISTS claims;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS statuses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS roles;

-- 1. Roles Lookup Table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Categories Lookup Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Statuses Lookup Table
CREATE TABLE IF NOT EXISTS statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 4. Users Table (Employees & Managers linked to AWS Cognito, with self-referencing manager_id)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cognito_sub VARCHAR(255) NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role_id INT NOT NULL,
    manager_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Expense Claims Table (Header level)
CREATE TABLE IF NOT EXISTS claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    claim_date DATE NOT NULL,
    status_id INT NOT NULL,
    reviewed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Claim Items Table (Sub-items with S3 receipt object key)
CREATE TABLE IF NOT EXISTS claim_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    item_date DATE NULL,
    notes TEXT NULL,
    s3_object_key VARCHAR(512) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
