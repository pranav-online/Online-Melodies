import { registerUser } from './api/db.js';

try {
  const user = await registerUser('testuser_' + Date.now(), 'testpassword');
  console.log('User registered successfully:', user);
} catch (err) {
  console.error('Registration failed:', err);
}
