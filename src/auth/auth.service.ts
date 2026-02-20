import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../storage/storage.service';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  apiKey: string;
  createdAt: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly storage: StorageService) {}

  register(email: string): { apiKey: string } {
    const users = this.storage.read<User[]>('users.json');

    if (users.some((u) => u.email === email)) {
      throw new ConflictException(`Email ${email} is already registered`);
    }

    const newUser: User = {
      id: uuidv4(),
      email,
      role: 'user',
      apiKey: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    this.storage.write('users.json', [...users, newUser]);

    return { apiKey: newUser.apiKey };
  }

  getMe(apiKey: string): Omit<User, 'apiKey'> & { apiKey: string } {
    const users = this.storage.read<User[]>('users.json');
    const user = users.find((u) => u.apiKey === apiKey);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  regenerateKey(apiKey: string): { apiKey: string } {
    const users = this.storage.read<User[]>('users.json');
    const index = users.findIndex((u) => u.apiKey === apiKey);
    if (index === -1) {
      throw new NotFoundException('User not found');
    }

    const newKey = uuidv4();
    users[index] = { ...users[index], apiKey: newKey };
    this.storage.write('users.json', users);

    return { apiKey: newKey };
  }

  deleteAccount(apiKey: string): void {
    const users = this.storage.read<User[]>('users.json');
    const index = users.findIndex((u) => u.apiKey === apiKey);
    if (index === -1) {
      throw new NotFoundException('User not found');
    }

    users.splice(index, 1);
    this.storage.write('users.json', users);
  }

  findByApiKey(apiKey: string): User | undefined {
    const users = this.storage.read<User[]>('users.json');
    return users.find((u) => u.apiKey === apiKey);
  }
}
