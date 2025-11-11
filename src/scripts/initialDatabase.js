// scripts/initializeDatabase.js
import User from '../models/userModel.js';
import RolePermission from '../models/rolePermission.js';

const initializeDatabase = async () => {
  try {
    // Không cần connect database ở đây nữa, sử dụng connection từ server.js
    console.log('🔄 Initializing database...');

    // Khởi tạo Role Permissions
    console.log('🔄 Initializing role permissions...');
    const defaultRoles = [
      {
        role: 'admin',
        permissions: {
          users: { view: true, create: true, edit: true, delete: true },
          projects: { view: true, create: true, edit: true, delete: true },
          media: { view: true, upload: true, edit: true, delete: true },
          rents: { view: true, create: true, edit: true, delete: true },
          bookings: { view: true, create: true, edit: true, delete: true }
        }
      },
      {
        role: 'project_manager',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          projects: { view: true, create: true, edit: true, delete: true },
          media: { view: true, upload: false, edit: false, delete: false },
          rents: { view: false, create: false, edit: false, delete: false },
          bookings: { view: false, create: false, edit: false, delete: false }
        }
      },
      {
        role: 'media_manager',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          projects: { view: true, create: false, edit: false, delete: false },
          media: { view: true, upload: true, edit: true, delete: true },
          rents: { view: false, create: false, edit: false, delete: false },
          bookings: { view: false, create: false, edit: false, delete: false }
        }
      },
      {
        role: 'rent_manager',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          projects: { view: true, create: false, edit: false, delete: false },
          media: { view: true, upload: false, edit: false, delete: false },
          rents: { view: true, create: true, edit: true, delete: true },
          bookings: { view: true, create: false, edit: false, delete: false }
        }
      },
      {
        role: 'booking_manager',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          projects: { view: true, create: false, edit: false, delete: false },
          media: { view: true, upload: false, edit: false, delete: false },
          rents: { view: true, create: false, edit: false, delete: false },
          bookings: { view: true, create: true, edit: true, delete: true }
        }
      }
    ];

    for (const roleData of defaultRoles) {
      await RolePermission.findOneAndUpdate(
        { role: roleData.role },
        roleData,
        { upsert: true, new: true }
      );
      console.log(`✅ Role ${roleData.role} initialized`);
    }

    // Khởi tạo Admin User
    console.log('🔄 Creating admin user...');
    const existingAdmin = await User.findOne({
      $or: [
        { username: 'admin' },
        { email: 'admin@system.com' }
      ]
    });

    if (!existingAdmin) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@system.com',
        password: '123456a@',
        fullName: 'System Administrator',
        role: 'admin',
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
      console.log('📧 Username: admin');
      console.log('🔑 Password: 123456a@');
      console.log('📧 Email: admin@system.com');
    } else {
      console.log('ℹ️ Admin user already exists');
      
      // Reset password về mặc định
      existingAdmin.password = '123456a@';
      await existingAdmin.save();
      console.log('✅ Admin password reset to default');
    }

    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error; // Ném lỗi để server.js xử lý
  }
};

export default initializeDatabase;