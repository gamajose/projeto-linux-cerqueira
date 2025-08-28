-- Certifique-se de que o banco existe
-- Check if the database exists before creating it
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'curso')
BEGIN
    CREATE DATABASE curso;
END;


-- Conecte ao banco 'curso' e execute:
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='certificates' AND xtype='U')
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    participant_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    hours INTEGER NOT NULL,
    issue_date DATE NOT NULL,
    completion_date DATE NOT NULL,
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    modalidade VARCHAR(100) DEFAULT 'Online',
    instrutor VARCHAR(255) DEFAULT 'José Moraes',
    diretor VARCHAR(255) DEFAULT 'Danilo Germano',
    organizacao VARCHAR(255) DEFAULT 'Red Innovations',
    hash_verificacao VARCHAR(50) UNIQUE NOT NULL,
    valido BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir alguns dados de exemplo
INSERT INTO certificates (participant_name, course_name, hours, issue_date, completion_date, certificate_id, hash_verificacao) VALUES
('João Silva', 'Introdução ao Linux', 2, '2024-01-15', '2024-01-15', 'LINUX2024-001', 'abc123def456'),
('Maria Santos', 'Comandos Terminal', 3, '2024-01-16', '2024-01-16', 'LINUX2024-002', 'ghi789jkl012');