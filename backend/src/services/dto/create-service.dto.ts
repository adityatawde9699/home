import { PricingModel } from '@prisma/client';

export class CreateServiceDto {
  categoryId: string;
  name: string;
  description?: string;
  pricingModel: PricingModel;
  basePricePaise: number;
}
