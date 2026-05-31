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
    const createClient = isSecure ? xmlrpc.createSecureClient : xmlrpc.createClient;

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

  private callXmlRpc(client: xmlrpc.Client, method: string, params: any[]): Promise<any> {
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

  async create(model: string, values: Record<string, any>): Promise<number> {
    return this.executeKw(model, 'create', [values]);
  }

  async write(model: string, ids: number[], values: Record<string, any>): Promise<boolean> {
    return this.executeKw(model, 'write', [ids, values]);
  }

  async read(model: string, ids: number[], fields: string[] = []): Promise<any[]> {
    return this.executeKw(model, 'read', [ids], { fields });
  }

  async getVersion(): Promise<any> {
    if (!this.commonClient) return null;
    return this.callXmlRpc(this.commonClient, 'version', []);
  }

  private tryDecodePdf(result: any): Buffer | null {
    if (Array.isArray(result) && result.length > 0) {
      const first = result[0];
      if (typeof first === 'string' && first.length > 0) return Buffer.from(first, 'base64');
      if (first instanceof Buffer) return first;
    }

    if (typeof result === 'string' && result.length > 0) {
      return Buffer.from(result, 'base64');
    }

    return null;
  }

  private getBaseUrl(): string {
    const parsed = new URL(this.url);
    return `${parsed.protocol}//${parsed.host}`;
  }

  private async authenticateWebSession(): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.getBaseUrl()}/web/session/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            db: this.db,
            login: this.username,
            password: this.apiKey,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} autenticando sesión web Odoo`);
      }

      const data = await res.json();
      if (data?.error) {
        throw new Error(`Error autenticando sesión web: ${JSON.stringify(data.error)}`);
      }

      const rawSetCookie = res.headers.get('set-cookie') ?? '';
      const match = rawSetCookie.match(/session_id=[^;]+/);
      if (!match?.[0]) {
        throw new Error('No se recibió cookie de sesión de Odoo');
      }

      return match[0];
    } finally {
      clearTimeout(timer);
    }
  }

  private async downloadInvoicePdfByHttp(invoiceId: number): Promise<Buffer> {
    const sessionCookie = await this.authenticateWebSession();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const reportUrl = `${this.getBaseUrl()}/report/pdf/account.report_invoice/${invoiceId}?download=true`;
      const res = await fetch(reportUrl, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`No se pudo descargar PDF vía HTTP (${res.status}): ${txt.slice(0, 200)}`);
      }

      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    } finally {
      clearTimeout(timer);
    }
  }

  async renderInvoicePdf(invoiceId: number): Promise<Buffer> {
    if (!this.uid) await this.authenticate();

    try {
      const reportResult = await this.callXmlRpc(this.reportClient, 'render_report', [
        this.db,
        this.uid,
        this.apiKey,
        'account.report_invoice',
        [invoiceId],
      ]);

      const parsed = this.tryDecodePdf(reportResult);
      if (parsed) return parsed;
    } catch (err) {
      this.logger.warn(
        `XML-RPC report service unavailable, falling back to HTTP report endpoint: ${err.message}`,
      );
    }

    return this.downloadInvoicePdfByHttp(invoiceId);
  }

  isConnected(): boolean {
    return this.uid !== null;
  }
}
