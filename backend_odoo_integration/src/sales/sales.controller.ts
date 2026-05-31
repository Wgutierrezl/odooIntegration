import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'seller')
  findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.salesService.findAll(limit ?? 40, offset ?? 0);
  }

  @Get('quotations')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'seller')
  findQuotations(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.salesService.findQuotations(limit ?? 40, offset ?? 0);
  }

  @Get('orders')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  findOrders(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.salesService.findOrders(limit ?? 40, offset ?? 0);
  }

  @Get(':id/documents')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'seller')
  getDocuments(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.getDocuments(id);
  }

  @Get(':id/quotation/pdf')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'seller')
  async getQuotationPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.salesService.getQuotationPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=quotation-${id}.pdf`,
    });
    res.send(pdf);
  }

  @Get(':id/order/pdf')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'seller')
  async getSaleOrderPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.salesService.getSaleOrderPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=sale-order-${id}.pdf`,
    });
    res.send(pdf);
  }

  @Get('invoices/:id/pdf')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async getInvoicePdfByInvoiceId(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.salesService.getInvoicePdfByInvoiceId(id, false);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${id}.pdf`,
    });
    res.send(pdf);
  }

  @Get('invoices/:id/draft/pdf')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'seller')
  async getDraftInvoicePdfByInvoiceId(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.salesService.getInvoicePdfByInvoiceId(id, true);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-draft-${id}.pdf`,
    });
    res.send(pdf);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'seller')
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }

  @Post(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'seller')
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.confirm(id);
  }

  @Post(':id/invoice')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  createInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.createInvoice(id);
  }

  @Get(':id/invoice/pdf')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async getInvoicePdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.salesService.getInvoicePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-order-${id}.pdf`,
    });
    res.send(pdf);
  }
}
