CREATE DATABASE IF NOT EXISTS exp192;
CREATE USER IF NOT EXISTS 'exp192_user' @'localhost' identified BY 'acml2016';
GRANT DELETE,INSERT,SELECT,UPDATE ON  exp192.* TO 'exp192_user' @'localhost';
FLUSH privileges;
USE exp192;
-- 上書き用
DROP TABLE IF EXISTS pairs;
DROP TABLE IF EXISTS players;
-- プレイヤー情報の管理用テーブル
CREATE TABLE IF NOT EXISTS players(
    id INT unsigned auto_increment PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL UNIQUE,
    socket_id VARCHAR(20) DEFAULT NULL UNIQUE,
    is_Host BOOLEAN DEFAULT NULL,
    is_male BOOLEAN DEFAULT NULL,
    age TINYINT unsigned DEFAULT 255,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) engine = innodb DEFAULT charset = utf8 COLLATE = utf8_unicode_ci auto_increment = 1;
-- ペア情報の管理用テーブル
CREATE TABLE IF NOT EXISTS pairs(
    id INT unsigned auto_increment PRIMARY KEY,
    host_id VARCHAR(20) DEFAULT NULL,
    guest_id VARCHAR(20) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_host_id FOREIGN KEY(host_id) REFERENCES players(socket_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_guest_id FOREIGN KEY(guest_id) REFERENCES players(socket_id) ON DELETE RESTRICT ON UPDATE CASCADE
) engine = innodb DEFAULT charset = utf8 COLLATE = utf8_unicode_ci auto_increment = 1;