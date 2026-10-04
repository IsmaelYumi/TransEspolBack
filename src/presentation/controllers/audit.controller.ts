import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from '../../infrastructure/database/audit.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { UserRole } from '../../domain/enums';

@ApiTags('Auditoría Administrativa (Audit Logs)')
@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar registros de auditoría administrativa (Solo Administrador)',
    description: 'Permite reconstruir quién modificó qué, cuándo y qué valores cambiaron.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Listado de eventos auditados' })
  async getLogs(@Query('limit') limit = 50) {
    return await this.auditService.getRecentLogs(Number(limit));
  }
}
