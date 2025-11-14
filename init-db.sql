-- Create letterbox_user for production use
-- In production, replace 'CHANGE_ME_IN_PRODUCTION' with a strong password
CREATE USER letterbox_user WITH PASSWORD 'CHANGE_ME_IN_PRODUCTION';

-- Grant privileges to letterbox_user
GRANT ALL PRIVILEGES ON DATABASE letterbox TO letterbox_user;

-- Connect to letterbox database
\c letterbox

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO letterbox_user;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO letterbox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO letterbox_user;
