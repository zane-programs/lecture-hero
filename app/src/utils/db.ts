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

  async createSummary(
    username: string,
    title: string,
    transcript: string,
    content: string
  ) {
    this.assertConnected();

    return await this.prisma.notes.create({
      data: { title, transcript, content, created_by: username },
    });
  }

  async checkAuth(username: string, password: string) {
    this.assertConnected();

    // Find user and verify they exist
    const user = await this.prisma.users.findFirst({
      where: { username },
    });
    if (!user || !user.password) return false;

    // Verify bcrypt hash (`user.password` is a hash, NOT the actual password)
    return await verify(password, user.password);
  }

  async getSummmary(id: string) {
    this.assertConnected();
    return await this.prisma.notes.findFirst({ where: { id } });
  }

  async findSummaryByTranscript(transcript: string) {
    this.assertConnected();
    return await this.prisma.notes.findFirst({
      where: { transcript },
    });
  }

  private assertConnected() {
    if (!this.isConnected)
      throw new Error(
        "Database not connected yet. Please run DBClient.connect() to connect"
      );
  }
}
