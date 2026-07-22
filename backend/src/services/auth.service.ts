import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { signAccessToken } from "../utils/jwt";

const userRepository = new UserRepository();

function sanitizeUser(user: { id: string; name: string; email: string; role: Role; createdAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

export class AuthService {
  async register(input: { name: string; email: string; password: string }) {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AppError(409, "Email is already registered", "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: Role.ADMIN
    });

    return {
      user: sanitizeUser(user),
      token: signAccessToken({ sub: user.id, email: user.email, role: user.role })
    };
  }

  async login(input: { email: string; password: string }) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    return {
      user: sanitizeUser(user),
      token: signAccessToken({ sub: user.id, email: user.email, role: user.role })
    };
  }

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    return sanitizeUser(user);
  }
}
