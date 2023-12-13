import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import * as uuid from 'uuid';

import { AppService } from '~/app/app.service';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { LeadWebhookBody } from './lead.dto';
import { APIException } from '~/api.excetion';
import { MemberInfrastructure } from '~/member/member.infra';
import { Member } from '~/member/entity/member.entity';

@Injectable()
export class LeadService {
  constructor(
    private readonly appService: AppService,
    private readonly memberInfra: MemberInfrastructure,
    private readonly definitionInfra: DefinitionInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async storeLead(appId: string, body: LeadWebhookBody) {
    this.entityManager.transaction(async (entityManager) => {
      const app = await this.appService.getAppInfo(appId);
      if (!app) {
        throw new APIException(
          {
            code: 'E_APP_NOT_FOUND',
            message: 'app not found',
            result: { appId },
          },
          404,
        );
      }
      const propertyNameToField = {
        填單日期: 'created_time',
        廣告素材: 'adset_name',
        廣告組合: 'ad_name',
        行銷活動: 'campaign_name',
        觸及平台: 'platform',
        縣市: 'city',
      };
      const properties = await this.definitionInfra.upsertProperties(
        appId,
        Object.keys(propertyNameToField),
        entityManager,
      );
      const member = await this.upsertMember(appId, {
        email: body.email,
        name: body.full_name,
        username: body.email,
        role: 'general-member',
      });
      await Promise.all(
        properties.map((property) => {
          return this.memberInfra.upsertMemberProperty(
            this.entityManager,
            member.id,
            property.id,
            body[propertyNameToField[property.name]],
          );
        }),
      );
      await this.memberInfra.upsertMemberPhone(this.entityManager, member.id, body.phone_number);
    });
  }

  private async upsertMember(
    appId: string,
    data: {
      email: string;
      name: string;
      username: string;
      role: string;
    },
  ) {
    let member = await this.memberInfra.firstMemberByCondition(this.entityManager, {
      appId,
      email: data.email,
    });
    if (member) {
      const metadata = member.metadata as { is_distributed?: boolean; from_lead_webhook_at: string };
      member.metadata = {
        ...metadata,
        is_distributed: metadata.is_distributed ?? false,
        from_lead_webhook_at: metadata.from_lead_webhook_at ?? new Date().toISOString(),
      };
    } else {
      const memberRepo = this.entityManager.getRepository(Member);
      member = memberRepo.create({
        id: uuid.v4(),
        appId,
        email: data.email,
        name: data.name,
        username: data.username,
        role: data.role,
        metadata: {
          is_distributed: false,
          from_lead_webhook_at: new Date().toISOString(),
        },
      });
    }
    return this.memberInfra.saveMember(this.entityManager, member);
  }
}
