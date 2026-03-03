'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';
import { Mail, Send, CheckCircle, Clock, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  const { t, dir } = useI18n();
  const reducedMotion = useReducedMotion();

  const fadeUp = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.fadeUp;
  const stagger = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.staggerContainer;

  const content = t.contact || {
    title: 'Contact Us',
    subtitle: 'Have a question, suggestion, or feedback? We\'d love to hear from you.',
    nameLabel: 'Your Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    subjectLabel: 'Subject',
    subjectPlaceholder: 'What is this about?',
    messageLabel: 'Message',
    messagePlaceholder: 'Tell us what\'s on your mind...',
    send: 'Send Message',
    sending: 'Sending...',
    successTitle: 'Message Sent!',
    successText: 'Thank you for reaching out. We\'ll get back to you as soon as possible.',
    sendAnother: 'Send another message',
    errorText: 'Something went wrong. Please try again later.',
    infoTitle: 'Other Ways to Reach Us',
    infoEmail: 'rumi.ai.agent@gmail.com',
    infoResponse: 'Response Time',
    infoResponseText: 'We typically respond within 24–48 hours.',
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

      setSending(true);
      setError('');

      try {
        const resp = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'general',
            message: `[Contact] From: ${form.name} <${form.email}>\nSubject: ${form.subject}\n\n${form.message}`,
          }),
        });

        if (!resp.ok) {
          setError(content.errorText);
          return;
        }

        setSent(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } catch {
        setError(content.errorText);
      } finally {
        setSending(false);
      }
    },
    [form, content.errorText],
  );

  const handleReset = useCallback(() => {
    setSent(false);
    setError('');
  }, []);

  return (
    <main className="contact-page" dir={dir}>
      {/* Hero */}
      <section className="contact-hero">
        <motion.div
          className="contact-hero-content"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div className="contact-hero-icon-wrap" variants={fadeUp}>
            <MessageCircle size={40} strokeWidth={1.5} />
          </motion.div>
          <motion.h1 className="contact-hero-title" variants={fadeUp}>
            {content.title}
          </motion.h1>
          <motion.p className="contact-hero-subtitle" variants={fadeUp}>
            {content.subtitle}
          </motion.p>
        </motion.div>
      </section>

      {/* Form + Info */}
      <section className="contact-body">
        <div className="contact-container">
          <div className="contact-grid">
            {/* Form Card */}
            <motion.div
              className="contact-form-card"
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={reducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="success"
                    className="contact-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="contact-success-icon">
                      <CheckCircle size={32} />
                    </div>
                    <h2 className="contact-success-title">{content.successTitle}</h2>
                    <p className="contact-success-text">{content.successText}</p>
                    <button
                      type="button"
                      className="contact-success-btn"
                      onClick={handleReset}
                    >
                      {content.sendAnother}
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    className="contact-form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="contact-form-row">
                      <div className="contact-field">
                        <label htmlFor="contact-name" className="contact-label">
                          {content.nameLabel}
                        </label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          className="contact-input"
                          placeholder={content.namePlaceholder}
                          value={form.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="contact-field">
                        <label htmlFor="contact-email" className="contact-label">
                          {content.emailLabel}
                        </label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          className="contact-input"
                          placeholder={content.emailPlaceholder}
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="contact-field">
                      <label htmlFor="contact-subject" className="contact-label">
                        {content.subjectLabel}
                      </label>
                      <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        className="contact-input"
                        placeholder={content.subjectPlaceholder}
                        value={form.subject}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="contact-field">
                      <label htmlFor="contact-message" className="contact-label">
                        {content.messageLabel}
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        className="contact-textarea"
                        placeholder={content.messagePlaceholder}
                        value={form.message}
                        onChange={handleChange}
                        rows={5}
                        required
                      />
                    </div>

                    {error && <p className="contact-error">{error}</p>}

                    <button
                      type="submit"
                      className="contact-submit"
                      disabled={sending}
                    >
                      {sending ? (
                        content.sending
                      ) : (
                        <>
                          <Send size={16} />
                          {content.send}
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Info sidebar */}
            <motion.aside
              className="contact-info"
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={reducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <h3 className="contact-info-title">{content.infoTitle}</h3>

              <div className="contact-info-items-group">
                <div className="contact-info-item">
                  <Mail size={18} className="contact-info-icon" />
                  <div>
                    <span className="contact-info-label">{content.emailLabel}</span>
                    <a href={`mailto:${content.infoEmail}`} className="contact-info-value">
                      {content.infoEmail}
                    </a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <Clock size={18} className="contact-info-icon" />
                  <div>
                    <span className="contact-info-label">{content.infoResponse}</span>
                    <span className="contact-info-value">{content.infoResponseText}</span>
                  </div>
                </div>
              </div>

              {/* Decorative Rumi quote */}
              <blockquote className="contact-quote">
                <p>&ldquo;Raise your words, not your voice. It is rain that grows flowers, not thunder.&rdquo;</p>
                <cite>— Rumi</cite>
              </blockquote>
            </motion.aside>
          </div>
        </div>
      </section>
    </main>
  );
}
