# chrome-note
chrome插件：笔记

# 数据库表结构
CREATE TABLE users (  
  id SERIAL PRIMARY KEY,  
  username VARCHAR(50) UNIQUE NOT NULL,  
  password_hash TEXT NOT NULL,  
  created_at TIMESTAMP DEFAULT NOW()  
);  

CREATE TABLE notes (  
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  
  title TEXT NOT NULL,  
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),  
  domain TEXT NOT NULL,  
  url TEXT NOT NULL,  
  is_public BOOLEAN DEFAULT FALSE,  
  updated_at TIMESTAMP DEFAULT NOW()  
);
