import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars, { type TemplateDelegate } from 'handlebars';
import {
  DEFAULT_NOTIFICATION_LOCALE,
  SUPPORTED_NOTIFICATION_LOCALES,
  type NotificationLocale,
} from './notifications.constants';

export type RenderedTemplate = {
  subject: string;
  html: string;
  text: string;
};

type TemplateName =
  | 'password-reset'
  | 'appointment-confirmation'
  | 'appointment-reminder'
  | 'waitlist-offer';

type TemplateCacheEntry = {
  subject: string;
  render: TemplateDelegate;
};

@Injectable()
export class TemplateService implements OnModuleInit {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templates = new Map<string, TemplateCacheEntry>();
  private readonly templateNames: TemplateName[] = [
    'password-reset',
    'appointment-confirmation',
    'appointment-reminder',
    'waitlist-offer',
  ];

  onModuleInit(): void {
    for (const templateName of this.templateNames) {
      for (const locale of SUPPORTED_NOTIFICATION_LOCALES) {
        this.loadTemplate(templateName, locale);
      }
    }

    this.logger.log(`loaded_templates count=${this.templates.size}`);
  }

  render<TVariables extends Record<string, unknown>>(
    templateName: TemplateName,
    locale: NotificationLocale | string | null | undefined,
    variables: TVariables,
  ): RenderedTemplate {
    const selectedLocale = this.normalizeLocale(locale);
    const entry = this.templates.get(this.cacheKey(selectedLocale, templateName))
      ?? this.templates.get(this.cacheKey(DEFAULT_NOTIFICATION_LOCALE, templateName));

    if (!entry) {
      throw new Error(`Template not loaded: ${templateName}`);
    }

    const html = entry.render(variables);
    return {
      subject: entry.subject,
      html,
      text: this.htmlToText(html),
    };
  }

  private loadTemplate(templateName: TemplateName, locale: NotificationLocale): void {
    const filePath = join(process.cwd(), 'src', 'notifications', 'templates', locale, `${templateName}.hbs`);
    if (!existsSync(filePath)) {
      if (locale === DEFAULT_NOTIFICATION_LOCALE) {
        throw new Error(`Missing required template: ${filePath}`);
      }
      return;
    }

    const source = readFileSync(filePath, 'utf8');
    const subject = this.extractSubject(source, filePath);
    this.templates.set(this.cacheKey(locale, templateName), {
      subject,
      render: Handlebars.compile(source),
    });
  }

  private extractSubject(source: string, filePath: string): string {
    const match = source.match(/\{\{!--\s*subject:\s*(.+?)\s*--\}\}/);
    if (!match?.[1]) {
      throw new Error(`Missing subject comment in template: ${filePath}`);
    }
    return match[1].trim();
  }

  private normalizeLocale(locale: NotificationLocale | string | null | undefined): NotificationLocale {
    return locale === 'ar' ? 'ar' : DEFAULT_NOTIFICATION_LOCALE;
  }

  private cacheKey(locale: NotificationLocale, templateName: TemplateName): string {
    return `${locale}:${templateName}`;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
