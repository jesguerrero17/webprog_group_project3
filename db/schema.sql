-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- MATCHES TABLE
-- Stores each online multiplayer match
-- ============================================
CREATE TABLE matches (
    match_id VARCHAR(64) PRIMARY KEY,   -- UUID or random code

    host_id INT,
    join_id INT,

    status ENUM('waiting', 'active', 'finished') DEFAULT 'waiting',

    -- ✅ gameMode replaces old "mode"
    gameMode ENUM('speed', 'moves') NOT NULL,

    board_state TEXT NOT NULL,          -- initial deck JSON

    -- ✅ Real-time sync fields
    host_deck TEXT NULL,
    join_deck TEXT NULL,

    host_clicked INT NULL,
    host_empty INT NULL,

    join_clicked INT NULL,
    join_empty INT NULL,

    last_move_by ENUM('host','join') DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (host_id) REFERENCES users(id),
    FOREIGN KEY (join_id) REFERENCES users(id)
);


-- ============================================
-- MATCH PLAYERS TABLE
-- Links players to matches and stores performance
-- ============================================
CREATE TABLE match_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id VARCHAR(64) NOT NULL,
    user_id INT NOT NULL,

    is_host TINYINT(1) DEFAULT 0,
    moves INT DEFAULT 0,
    time INT DEFAULT 0,
    finished TINYINT(1) DEFAULT 0,

    FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================
-- MATCH RESULTS TABLE
-- Stores final results for competitive wins
-- ============================================
CREATE TABLE match_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id VARCHAR(64) NOT NULL,

    winner_id INT NOT NULL,
    loser_id INT NOT NULL,

    -- ✅ gameMode replaces old "mode"
    gameMode ENUM('speed', 'moves') NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (loser_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================
-- LEADERBOARD TABLE
-- Stores local or online scores
-- ============================================
CREATE TABLE leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),

    moves INT,
    time INT,

    -- ✅ playMode replaces game_type
    playMode ENUM('local','online') NOT NULL,

    -- ✅ gameMode replaces mode
    gameMode ENUM('speed','moves') NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_updated ON matches(updated_at);

CREATE INDEX idx_match_players_match ON match_players(match_id);

CREATE INDEX idx_match_results_winner ON match_results(winner_id);
CREATE INDEX idx_match_results_mode ON match_results(gameMode);

CREATE INDEX idx_leaderboard_playMode ON leaderboard(playMode);
CREATE INDEX idx_leaderboard_gameMode ON leaderboard(gameMode);