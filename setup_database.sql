CREATE DATABASE IF NOT EXISTS exp192;
CREATE USER IF NOT EXISTS 'exp192_user' @'localhost' identified BY 'acml2016';
GRANT DELETE,INSERT,SELECT,UPDATE ON  exp192.* TO 'exp192_user' @'localhost';
FLUSH privileges;
USE exp192;

-- 上書き用(子から先に消す)
DROP TABLE IF EXISTS commons;
DROP TABLE IF EXISTS personals;
DROP TABLE IF EXISTS pairs;
DROP TABLE IF EXISTS players;

-- プレイヤー情報の管理用テーブル
CREATE TABLE IF NOT EXISTS players(
    -- id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- user_id VARCHAR(20) NOT NULL UNIQUE,
    id VARCHAR(20) PRIMARY KEY,
    is_host BOOLEAN DEFAULT NULL,
    is_male BOOLEAN DEFAULT NULL,
    age TINYINT UNSIGNED DEFAULT NULL,
    partner_id VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(partner_id) REFERENCES players(id) ON DELETE RESTRICT ON UPDATE CASCADE
) engine = innodb DEFAULT charset = utf8 COLLATE = utf8_unicode_ci AUTO_INCREMENT = 1;

-- ペア情報の管理用テーブル
CREATE TABLE IF NOT EXISTS pairs(
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    host_id VARCHAR(20) DEFAULT NULL,
    guest_id VARCHAR(20) DEFAULT NULL,
    -- phase VARCHAR(10) DEFAULT NULL, 
    status VARCHAR(10) DEFAULT "DEFAULT", 
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(host_id) REFERENCES players(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY(guest_id) REFERENCES players(id) ON DELETE RESTRICT ON UPDATE CASCADE
) engine = innodb DEFAULT charset = utf8 COLLATE = utf8_unicode_ci AUTO_INCREMENT = 1;

-- ペア内で共通のゲーム情報の管理用テーブル
CREATE TABLE IF NOT EXISTS commons(
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pair_id INT UNSIGNED NOT NULL, 
    game_mode TINYINT UNSIGNED NOT NULL,
    current_round INT UNSIGNED NOT NULL,
    reward TINYINT UNSIGNED,
    host_pre TINYINT UNSIGNED,
    host_post TINYINT UNSIGNED,
    guest_pre TINYINT UNSIGNED,
    guest_post TINYINT UNSIGNED, 
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(pair_id) REFERENCES pairs(id) ON DELETE RESTRICT ON UPDATE CASCADE
) engine = innodb DEFAULT charset = utf8 COLLATE = utf8_unicode_ci AUTO_INCREMENT = 1;

-- ペア内で個別のゲーム情報の管理用テーブル
CREATE TABLE IF NOT EXISTS personals(
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    pair_id INT UNSIGNED NOT NULL, 
    game_mode TINYINT UNSIGNED NOT NULL,
    current_round INT UNSIGNED NOT NULL,
    score INT UNSIGNED NOT NULL,
    message0 TINYINT UNSIGNED DEFAULT NULL,
    message1 TINYINT UNSIGNED DEFAULT NULL,
    message2 TINYINT UNSIGNED DEFAULT NULL,
    is_first BOOLEAN DEFAULT NULL,
    message_at INT DEFAULT NULL,
    behavior CHAR(1) DEFAULT NULL,
    behavior_at INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY(pair_id) REFERENCES pairs(id) ON DELETE RESTRICT ON UPDATE CASCADE
) engine = innodb DEFAULT charset = utf8 COLLATE = utf8_unicode_ci AUTO_INCREMENT = 1;
