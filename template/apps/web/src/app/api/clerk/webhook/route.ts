import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { Webhook } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { env } from '../../../../lib/env';
import { prisma } from '../../../../lib/db';

function normalizeRole(role: string | null | undefined): string {
  if (!role) return 'member';
  return role.replace(/^org:/, '');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = req.headers;
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }

  const wh = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid clerk signature' }, { status: 400 });
  }


  const clerkEventId = typeof event.data.id === 'string' ? event.data.id : svixId;

  try {
    await prisma.clerkEvent.create({
      data: {
        clerkEventId,
        type: event.type,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ synced: true, duplicate: true });
    }

    throw error;
  }

  switch (event.type) {
    case 'user.created':
    case 'user.updated': {
      const user = event.data;
      const email = user.email_addresses?.[0]?.email_address;
      if (!email) break;

      await prisma.user.upsert({
        where: { clerkUserId: user.id },
        update: {
          email,
          name: [user.first_name, user.last_name].filter(Boolean).join(' ') || null,
        },
        create: {
          clerkUserId: user.id,
          email,
          name: [user.first_name, user.last_name].filter(Boolean).join(' ') || null,
        },
      });
      break;
    }

    case 'organization.created':
    case 'organization.updated': {
      const org = event.data;
      await prisma.org.upsert({
        where: { clerkOrgId: org.id },
        update: {
          name: org.name,
          slug: slugify(org.slug || org.name || org.id),
        },
        create: {
          clerkOrgId: org.id,
          name: org.name,
          slug: slugify(org.slug || org.name || org.id),
        },
      });
      break;
    }

    case 'organizationMembership.created':
    case 'organizationMembership.updated': {
      const membership = event.data;

      const user = await prisma.user.findUnique({ where: { clerkUserId: membership.public_user_data.user_id } });
      const org = await prisma.org.findUnique({ where: { clerkOrgId: membership.organization.id } });

      if (!user || !org) {
        break;
      }

      await prisma.orgMember.upsert({
        where: { clerkOrgMembershipId: membership.id },
        update: {
          role: normalizeRole(membership.role),
          orgId: org.id,
          userId: user.id,
        },
        create: {
          clerkOrgMembershipId: membership.id,
          role: normalizeRole(membership.role),
          orgId: org.id,
          userId: user.id,
        },
      });
      break;
    }

    case 'organizationMembership.deleted': {
      const membership = event.data;
      await prisma.orgMember.deleteMany({ where: { clerkOrgMembershipId: membership.id } });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ synced: true });
}
