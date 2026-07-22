import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";

export class UserRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  create(data: { name: string; email: string; passwordHash: string; role?: Role }) {
    return prisma.user.create({
      data: {
        ...data,
        role: data.role ?? Role.EMPLOYEE
      }
    });
  }
}
