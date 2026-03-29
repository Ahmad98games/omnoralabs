/**
 * EmailService: Industrial Notification Engine (Law 7 Compliant)
 * 
 * DESIGN:
 * - Singleton pattern for global access.
 * - Provider-agnostic base handler (Resend/Postmark).
 * - Strictly typed templates with dynamic injection.
 * - Edge-compatible (no heavy dependencies).
 * - Telemetry-enforced: every send logs to `email_logs`.
 */

import { supabase } from '../supabaseClient';

export type EmailTemplate = 'order_confirmation' | 'abandoned_cart_recovery' | 'welcome_email';

export interface EmailOptions {
    to: string;
    template: EmailTemplate;
    data: Record<string, unknown>;
    merchantId: string;
    subject?: string;
}

export interface EmailLogEntry {
    merchant_id: string;
    type: EmailTemplate;
    recipient: string;
    status: 'sent' | 'failed';
    error_msg?: string;
    metadata: Record<string, unknown>;
}

class EmailService {
    private static instance: EmailService;
    private apiKey: string = process.env.VITE_RESEND_API_KEY || '';
    private apiUrl: string = 'https://api.resend.com/emails';

    private constructor() {}

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * Send an industrial notification and log telemetry.
     * Includes automated retry logic for API resilience.
     */
    public async sendEmail(options: EmailOptions, retryCount: number = 0): Promise<{ success: boolean; error?: string }> {
        const { to, template, data, merchantId, subject } = options;
        const maxRetries = 3;
        
        try {
            const htmlContent = this.renderTemplate(template, data);
            const defaultSubject = this.getDefaultSubject(template, data);

            // 1. External Provider Call (Resend/Postmark agnostic)
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    from: 'Omnora OS <notifications@omnora.com>',
                    to: [to],
                    subject: subject || defaultSubject,
                    html: htmlContent,
                }),
            });

            const result = await response.json() as { message?: string };
            const success = response.ok;

            if (!success && retryCount < maxRetries) {
                console.warn(`[EmailService] API Failure. Retrying (${retryCount + 1}/${maxRetries})...`);
                await new Promise(res => setTimeout(res, Math.pow(2, retryCount) * 1000)); // Exponential backoff
                return this.sendEmail(options, retryCount + 1);
            }


            // 2. Law 7 Telemetry Logging
            await this.logTelemetry({
                merchant_id: merchantId,
                type: template,
                recipient: to,
                status: success ? 'sent' : 'failed',
                error_msg: success ? undefined : result.message || 'API Failure after retries',
                metadata: { ...data, retry_count: retryCount, final_error: result.message },
            });

            return { success, error: success ? undefined : result.message };

        } catch (err: unknown) {
            const error = err as Error;
            console.error(`[EmailService] Critical Failure for ${to}:`, error.message);
            
            if (retryCount < maxRetries) {
                await new Promise(res => setTimeout(res, Math.pow(2, retryCount) * 1000));
                return this.sendEmail(options, retryCount + 1);
            }

            // Log catastrophic failure
            await this.logTelemetry({
                merchant_id: merchantId,
                type: template,
                recipient: to,
                status: 'failed',
                error_msg: error.message,
                metadata: { 
                    ...data, 
                    fatal: true, 
                    retry_count: retryCount,
                    error_stack: error.stack, // 📊 TELEMETRY POLISH
                    timestamp: new Date().toISOString()
                },
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Lightweight Template Renderer (Edge Compatible)
     * Replaces {{variable}} with data values.
     */
    private renderTemplate(template: EmailTemplate, data: Record<string, unknown>): string {
        const rawHtml = this.getTemplateHtml(template);
        return rawHtml.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const value = key.trim().split('.').reduce((obj: unknown, k: string) => {
                if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k];
                return undefined;
            }, data);
            return value !== undefined ? String(value) : match;
        });
    }

    private getDefaultSubject(template: EmailTemplate, data: Record<string, unknown>): string {
        switch (template) {
            case 'order_confirmation': return `Order Confirmed: #${data.orderNumber || 'New Order'}`;
            case 'abandoned_cart_recovery': return 'You left something in your cart';
            case 'welcome_email': return `Welcome to ${data.storeName || 'the Store'}`;
            default: return 'Information from Omnora';
        }
    }

    private getTemplateHtml(template: EmailTemplate): string {
        // In a real implementation, these would be loaded from a storage bucket or assets
        // For the singleton MVP, we use industrial placeholders
        switch (template) {
            case 'order_confirmation':
                return `<h1>Order Confirmation</h1><p>Hi {{customerName}}, thank you for your order #{{orderNumber}}.</p><p>Total: {{total}}</p>`;
            case 'abandoned_cart_recovery':
                return `<h1>Did you forget something?</h1><p>Your items are waiting for you, {{customerName}}.</p><a href="{{recoveryUrl}}">Complete Purchase</a>`;
            case 'welcome_email':
                return `<h1>Welcome to {{storeName}}</h1><p>Glad to have you with us, {{customerName}}!</p>`;
            default:
                return `<p>{{message}}</p>`;
        }
    }

    private async logTelemetry(entry: EmailLogEntry): Promise<void> {
        const { error } = await supabase
            .from('email_logs')
            .insert(entry);
        
        if (error) {
            console.error('[EmailService] Telemetry Error:', error.message);
        }
    }
}

export const emailService = EmailService.getInstance();
