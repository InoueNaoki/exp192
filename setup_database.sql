CREATE DATABASE
IF NOT EXISTS exp192;
CREATE USER
IF NOT EXISTS 'exp192_user'@'localhost' IDENTIFIED BY 'acml2016';
GRANT DELETE, INSERT, SELECT, UPDATE ON exp192.* TO 'exp192_user'@'localhost';
FLUSH PRIVILEGES;
USE exp192;

/* 上書き用 */
DROP TABLE IF EXISTS pairs;
DROP TABLE IF EXISTS players;

/* プレイヤー情報の管理用テーブル */
CREATE TABLE
IF NOT EXISTS players
(
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cookie_id VARCHAR(20) NOT NULL UNIQUE, 
    current_socket_id VARCHAR(20) DEFAULT NULL UNIQUE,
    sex TINYINT DEFAULT 0, -- 1=male,2=female
    age TINYINT UNSIGNED DEFAULT 255,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
ENGINE = InnoDB 
DEFAULT CHARSET = utf8 
COLLATE = utf8_unicode_ci
AUTO_INCREMENT = 1 ;

/* ペア情報の管理用テーブル */
CREATE TABLE
IF NOT EXISTS pairs
(
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        host_id VARCHAR(20) DEFAULT NULL,
        guest_id VARCHAR(20) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_host_id
                FOREIGN KEY(host_id) 
                REFERENCES players(current_socket_id)
                ON DELETE RESTRICT
                ON UPDATE CASCADE,
        CONSTRAINT fk_guest_id
                FOREIGN KEY(guest_id) 
                REFERENCES players(current_socket_id)
                ON DELETE RESTRICT
                ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8 
COLLATE = utf8_unicode_ci
AUTO_INCREMENT = 1 ;
