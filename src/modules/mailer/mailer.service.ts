import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: this.config.get<string>('GMAIL_USER'),
      pass: this.config.get<string>('GMAIL_APP_PASSWORD'),
    },
  });

  constructor(private readonly config: ConfigService) {}

  async sendPasswordResetEmail(params: { to: string; token: string }) {
    const from = this.config.get<string>('MAIL_FROM') || this.config.get<string>('GMAIL_USER');
    const vendorResetBase = this.config.get<string>('VENDOR_RESET_URL');
    const customerResetBase = this.config.get<string>('CUSTOMER_RESET_URL');
    const defaultResetBase = this.config.get<string>('PASSWORD_RESET_URL');

    const resetLinks = [vendorResetBase, customerResetBase, defaultResetBase]
      .filter(Boolean)
      .map((base) => this.buildResetUrl(base as string, params.token));

    const firstLink = resetLinks[0] ?? params.token;
    const extraLinks =
      resetLinks.length > 1
        ? `\nAlternate reset links:\n${resetLinks.slice(1).map((link) => `- ${link}`).join('\n')}\n`
        : '';

    const mailOptions = {
      from,
      to: params.to,
      subject: 'Reset your TShots password',
      text: [
        'You requested a password reset. If this was not you, you can ignore this email.',
        '',
        'Use the link below to set a new password:',
        firstLink,
        '',
        extraLinks,
        'This link will expire soon.',
      ]
        .filter(Boolean)
        .join('\n'),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log('Sent password reset email');
    } catch (error) {
      this.logger.error('Failed to send reset email', error as any);
      throw error;
    }
  }

  async sendNotificationEmail(params: { to: string; subject: string; body: string }) {
    const from = this.config.get<string>('MAIL_FROM') || this.config.get<string>('GMAIL_USER');
    const mailOptions = {
      from,
      to: params.to,
      subject: params.subject,
      text: params.body,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log('Sent notification email');
    } catch (error) {
      this.logger.error('Failed to send notification email', error as any);
      throw error;
    }
  }

  private buildResetUrl(base: string, token: string) {
    const trimmed = base.replace(/\/$/, '');
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}token=${encodeURIComponent(token)}`;
  }
}
