import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { SearchContactDto } from './dto/search-contact.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get('customers')
  findCustomers(@Query() query: SearchContactDto) {
    return this.contactsService.findCustomers(query);
  }

  @Get('suppliers')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  findSuppliers(@Query() query: SearchContactDto) {
    return this.contactsService.findSuppliers(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.findOne(id);
  }

  @Post('customers')
  createCustomer(@Body() dto: CreateContactDto) {
    return this.contactsService.createCustomer(dto);
  }

  @Post('suppliers')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  createSupplier(@Body() dto: CreateContactDto) {
    return this.contactsService.createSupplier(dto);
  }
}
