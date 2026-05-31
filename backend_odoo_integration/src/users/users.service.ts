import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async findAll() {
    const users = await this.usersRepo.find();
    return users.map((u) => this.sanitize(u));
  }

  async create(dto: CreateUserDto) {
    this.logger.log(
      `Create user requested: email=${dto.email}, role_id=${dto.role_id}`,
    );

    const exists = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      this.logger.warn(`Create user rejected: email already exists (${dto.email})`);
      throw new ConflictException('Email already registered');
    }

    const user = this.usersRepo.create({
      email: dto.email,
      password_hash: await bcrypt.hash(dto.password, 10),
      full_name: dto.full_name,
      role_id: dto.role_id,
    });

    const saved = await this.usersRepo.save(user);
    this.logger.log(
      `User created successfully: id=${saved.id}, email=${saved.email}, role=${saved.role?.name ?? saved.role_id}`,
    );

    return this.sanitize(saved);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, dto);
    const saved = await this.usersRepo.save(user);
    return this.sanitize(saved);
  }

  async remove(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.is_active = false;
    await this.usersRepo.save(user);
    return { message: 'User deactivated' };
  }

  private sanitize(user: User) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role?.name,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
    };
  }
}
