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
  const managerRole = roles.find((r) => r.name === 'manager')!;
  const sellerRole = roles.find((r) => r.name === 'seller')!;

  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const managerPasswordHash = await bcrypt.hash('Manager123!', 10);
  const sellerPasswordHash = await bcrypt.hash('Seller123!', 10);

  await userRepo.save([
    {
      email: 'admin@platform.local',
      password_hash: adminPasswordHash,
      full_name: 'Administrator',
      role_id: adminRole.id,
      is_active: true,
    },
    {
      email: 'manager@platform.local',
      password_hash: managerPasswordHash,
      full_name: 'Operations Manager',
      role_id: managerRole.id,
      is_active: true,
    },
    {
      email: 'seller@platform.local',
      password_hash: sellerPasswordHash,
      full_name: 'POS Seller',
      role_id: sellerRole.id,
      is_active: true,
    },
  ]);

  console.log('Seed completed: 3 roles + 3 users (admin/manager/seller) created');
}
