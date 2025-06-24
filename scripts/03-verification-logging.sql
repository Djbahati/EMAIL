-- Create verification logs table for tracking verification attempts
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'email_verification', 'resend_verification', etc.
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'expired', 'invalid', etc.
  message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_username ON verification_logs(username);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_logs_status ON verification_logs(status);

-- Add token expiration to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing users to have expiration time (24 hours from now)
UPDATE users 
SET verification_token_expires_at = NOW() + INTERVAL '24 hours' 
WHERE verification_token IS NOT NULL AND verification_token_expires_at IS NULL;
