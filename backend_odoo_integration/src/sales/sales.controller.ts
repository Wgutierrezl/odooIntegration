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
  @Roles('admin', 'manager')
  findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.salesService.findAll(limit ?? 40, offset ?? 0);
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
  @Roles('admin', 'manager')
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
