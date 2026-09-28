import { Resend } from 'resend';
import { config } from '../../config';

export const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;
