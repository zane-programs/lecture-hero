-- Users
CREATE TABLE users (
  ID SERIAL PRIMARY KEY,
  username VARCHAR(30) UNIQUE,
  password VARCHAR(100),
  created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notes
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE notes (
  ID UUID DEFAULT uuid_generate_v4(),
  created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(30),
  content TEXT,
  transcript TEXT,
  PRIMARY KEY (ID),
  FOREIGN KEY (created_by) REFERENCES users(username)
);
