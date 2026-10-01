import { Router } from 'express';
import { websiteController } from './website.controller';
import { requireAuth } from '../../middleware/auth.middleware';

// 1. Public Wedding Website Router (mounted at /api/v1/public/weddings)
export const publicWebsiteRouter = Router();

publicWebsiteRouter.get('/:slug', websiteController.getPublicWebsite);
publicWebsiteRouter.post('/:slug/lookup-pass', websiteController.lookupGuestPass);
publicWebsiteRouter.get('/:slug/lookup-pass', websiteController.lookupGuestPass);
publicWebsiteRouter.post('/:slug/blessings', websiteController.addBlessing);

// 2. Protected Workspace Website Router (mounted at /api/v1/weddings/:weddingId/website)
export const websiteRouter = Router({ mergeParams: true });

websiteRouter.get('/', requireAuth, websiteController.getWebsiteConfig);
websiteRouter.patch('/', requireAuth, websiteController.updateWebsiteConfig);
