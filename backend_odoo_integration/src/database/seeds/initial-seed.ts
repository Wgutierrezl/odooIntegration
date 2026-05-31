import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';

export async function runSeed(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  const existingRoles = await roleRepo.count();
  if (existingRoles > 0) return;

  const roles = await roleRepo.save([
    { name: 'admin', description: 'Full access — user management and configuration' },
    { name: 'manager', description: 'Access to sales, CRM, dashboard, employees' },
    { name: 'seller', description: 'Access to POS, products, customers' },
  ]);

  const adminRole = roles.find((r) => r.name === 'admin')!;
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  await userRepo.save({
    email: 'admin@platform.local',
    password_hash: passwordHash,
    full_name: 'Administrator',
    role_id: adminRole.id,
    is_active: true,
  });

  console.log('Seed completed: 3 roles + admin user created');
}
