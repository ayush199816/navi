const bcrypt = require('bcryptjs');

async function verifyPassword() {
  const storedHash = '$2b$10$Qh8yCAB8VjM/sih5Ey9kKeuFpR3V7GTprG2.7fkh3nW181n7JIQlS';
  const passwordToCheck = 'Admin@1234';
  
  try {
    const isMatch = await bcrypt.compare(passwordToCheck, storedHash);
    console.log(`Password match for 'Admin@1234': ${isMatch}`);
    
    // If it doesn't match, let's try some common passwords
    if (!isMatch) {
      const commonPasswords = ['password', 'admin', 'admin123', 'password123', '123456'];
      for (const pwd of commonPasswords) {
        const match = await bcrypt.compare(pwd, storedHash);
        if (match) {
          console.log(`Found matching password: '${pwd}'`);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error comparing passwords:', error);
  }
}

verifyPassword();
