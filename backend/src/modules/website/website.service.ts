import { websiteRepository } from './website.repository';
import { AddBlessingInput } from './website.types';

export class WebsiteService {
  async getPublicWebsite(slug: string) {
    if (!slug) {
      throw new Error('Wedding slug is required');
    }
    const data = await websiteRepository.getPublicWebsiteBySlug(slug);
    if (!data) {
      throw new Error(`Royal wedding with slug "${slug}" not found`);
    }
    return data;
  }

  async lookupGuestPass(slug: string, query: string) {
    if (!slug) throw new Error('Wedding slug is required');
    if (!query || query.trim().length < 2) {
      throw new Error('Please enter at least 3 digits of your phone number or pass code');
    }
    const result = await websiteRepository.lookupGuestPass(slug, query);
    if (!result) {
      throw new Error('No invitation pass found matching your search. Please check your pass code or contact the couple.');
    }
    return result;
  }

  async addBlessing(slug: string, input: AddBlessingInput) {
    if (!slug) throw new Error('Wedding slug is required');
    if (!input.authorName || input.authorName.trim().length === 0) {
      throw new Error('Please provide your name');
    }
    if (!input.message || input.message.trim().length === 0) {
      throw new Error('Please enter a blessing message');
    }
    const blessing = await websiteRepository.addBlessing(slug, input);
    if (!blessing) {
      throw new Error(`Wedding with slug "${slug}" not found`);
    }
    return blessing;
  }
}

export const websiteService = new WebsiteService();
