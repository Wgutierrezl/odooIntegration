import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { UpdateLeadStageDto } from './dto/update-lead-stage.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Get('stages')
  getStages() {
    return this.crmService.getStages();
  }

  @Get('leads')
  getLeads(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.crmService.getLeads(limit ?? 80, offset ?? 0);
  }

  @Get('leads/:id')
  getLeadById(@Param('id', ParseIntPipe) id: number) {
    return this.crmService.getLeadById(id);
  }

  @Patch('leads/:id/stage')
  updateStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadStageDto,
  ) {
    return this.crmService.updateStage(id, dto.stage_id);
  }
}
