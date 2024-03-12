import { PrismaClient } from "@prisma/client";
import { hash, verify } from "@node-rs/bcrypt";

export default class DBClient {
  private prisma: PrismaClient;
  private _isConnected: boolean;

  constructor() {
    this.prisma = new PrismaClient();
    this._isConnected = false;
  }

  get isConnected() {
    return this._isConnected;
  }

  async connect() {
    await this.prisma.$connect();
    this._isConnected = true;
  }

  async disconnect() {
    await this.prisma.$disconnect();
    this._isConnected = false;
  }

  async createUser(username: string, password: string) {
    this.assertConnected();

    const passwordHash = await hash(password);

    return await this.prisma.users.create({
      data: { username, password: passwordHash },
    });
  }

  async checkAuth(username: string, password: string) {
    this.assertConnected();

    // Find user and verify they exist
    const user = await this.prisma.users.findFirst({ where: { username } });
    if (!user || !user.password) return false;

    // Verify bcrypt hash (`user.password` is a hash, NOT the actual password)
    return await verify(password, user.password);
  }

  async getUsers() {
    this.assertConnected();
    return await this.prisma.users.findMany();
  }

  async getNotes() {
    this.assertConnected();
    return await this.prisma.notes.findMany();
  }

  private assertConnected() {
    if (!this.isConnected)
      throw new Error(
        "Database not connected yet. Please run DBClient.connect() to connect"
      );
  }
}
