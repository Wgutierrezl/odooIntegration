import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';

class PurchaseLineDto {
  @IsInt()
  product_id: number;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0)
  price_unit: number;
}

export class CreatePurchaseDto {
  @IsInt()
  partner_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  lines: PurchaseLineDto[];

  @IsOptional()
  @IsBoolean()
  auto_confirm?: boolean;
}
