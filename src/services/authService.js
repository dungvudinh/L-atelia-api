// services/authService.js
import userService from './userService.js'
import jwt from 'jsonwebtoken'
const authService = {
  // Login user
  login: async (username, password) => {
    const user = await userService.getUserByUsernameOrEmail(username);
    console.log(user)
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials or account inactive');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await userService.updateLastLogin(user._id);

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    };
  },

  // Verify token
  verifyToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  },

  // Create admin user if not exists
  createAdminUser: async () => {
    const existingAdmin = await userService.getUserByUsernameOrEmail('admin');
    
    if (!existingAdmin) {
      await userService.createUser({
        username: 'admin',
        email: 'admin@system.com',
        password: '123456a@',
        fullName: 'System Administrator',
        role: 'admin'
      });
      console.log('Admin user created successfully');
    }
  }
};

export default authService;