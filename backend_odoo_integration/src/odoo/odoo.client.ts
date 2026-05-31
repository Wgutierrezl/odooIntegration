import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as xmlrpc from 'xmlrpc';

@Injectable()
export class OdooClient implements OnModuleInit {
  private readonly logger = new Logger(OdooClient.name);
  private uid: number | null = null;
  private commonClient: xmlrpc.Client;
  private objectClient: xmlrpc.Client;
  private reportClient: xmlrpc.Client;

  private url: string;
  private db: string;
  private username: string;
  private apiKey: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(private config: ConfigService) {
    this.url = this.config.get<string>('odoo.url') ?? '';
    this.db = this.config.get<string>('odoo.db') ?? '';
    this.username = this.config.get<string>('odoo.username') ?? '';
    this.apiKey = this.config.get<string>('odoo.apiKey') ?? '';
    this.timeoutMs = this.config.get<number>('odoo.timeoutMs') ?? 15000;
    this.maxRetries = this.config.get<number>('odoo.maxRetries') ?? 3;
  }

  async onModuleInit() {
    if (!this.url) {
      this.logger.warn('ODOO_URL not set — Odoo integration disabled');
      return;
    }

    const parsedUrl = new URL(this.url);
    const isSecure = parsedUrl.protocol === 'https:';
    const createClient = isSecure
      ? xmlrpc.createSecureClient
      : xmlrpc.createClient;

    this.commonClient = createClient({
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || (isSecure ? 443 : 80),
      path: '/xmlrpc/2/common',
    });

    this.objectClient = createClient({
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || (isSecure ? 443 : 80),
      path: '/xmlrpc/2/object',
    });

    this.reportClient = createClient({
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || (isSecure ? 443 : 80),
      path: '/xmlrpc/2/report',
    });

    try {
      await this.authenticate();
      this.logger.log(`Connected to Odoo — UID: ${this.uid}`);
    } catch (err) {
      this.logger.error(`Failed to connect to Odoo: ${err.message}`);
    }
  }

  private callXmlRpc(
    client: xmlrpc.Client,
    method: string,
    params: any[],
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`XML-RPC timeout after ${this.timeoutMs}ms`)),
        this.timeoutMs,
      );

      client.methodCall(method, params, (err, value) => {
        clearTimeout(timer);
        if (err) reject(err);
        else resolve(value);
      });
    });
  }

  async authenticate(): Promise<number> {
    const uid = await this.callXmlRpc(this.commonClient, 'authenticate', [
      this.db,
      this.username,
      this.apiKey,
      {},
    ]);

    if (!uid || uid === false) {
      throw new Error('Odoo authentication failed — check credentials');
    }

    this.uid = uid;
    return uid;
  }

  async executeKw(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {},
  ): Promise<any> {
    if (!this.uid) await this.authenticate();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.callXmlRpc(this.objectClient, 'execute_kw', [
          this.db,
          this.uid,
          this.apiKey,
          model,
          method,
          args,
          kwargs,
        ]);
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `Odoo call failed (attempt ${attempt}/${this.maxRetries}): ${model}.${method} — ${err.message}`,
        );
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }

  async searchRead(
    model: string,
    domain: any[] = [],
    fields: string[] = [],
    limit = 80,
    offset = 0,
    order?: string,
  ): Promise<any[]> {
    return this.executeKw(model, 'search_read', [domain], {
      fields,
      limit,
      offset,
      order: order ?? 'id desc',
    });
  }

  async searchCount(model: string, domain: any[] = []): Promise<number> {
    return this.executeKw(model, 'search_count', [domain]);
  }

  async create(
    model: string,
    values: Record<string, any>,
  ): Promise<number> {
    return this.executeKw(model, 'create', [values]);
  }

  async write(
    model: string,
    ids: number[],
    values: Record<string, any>,
  ): Promise<boolean> {
    return this.executeKw(model, 'write', [ids, values]);
  }

  async read(
    model: string,
    ids: number[],
    fields: string[] = [],
  ): Promise<any[]> {
    return this.executeKw(model, 'read', [ids], { fields });
  }

  async getVersion(): Promise<any> {
    if (!this.commonClient) return null;
    return this.callXmlRpc(this.commonClient, 'version', []);
  }

  async renderReport(
    reportName: string,
    ids: number[],
  ): Promise<{ base64: string; format: string }> {
    if (!this.uid) await this.authenticate();

    const result = await this.callXmlRpc(this.reportClient, 'render_report', [
      this.db,
      this.uid,
      this.apiKey,
      reportName,
      ids,
    ]);

    return { base64: result[0], format: result[1] };
  }

  isConnected(): boolean {
    return this.uid !== null;
  }
}
