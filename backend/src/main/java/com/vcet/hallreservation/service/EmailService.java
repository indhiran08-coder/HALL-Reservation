package com.vcet.hallreservation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Email Service — sends HTML emails for OTP, booking confirmation, updates, and cancellations.
 *
 * All methods are annotated with @Async to avoid blocking the HTTP response thread.
 * Email sending is non-critical for the response; failures are logged but not propagated.
 *
 * Email templates use inline HTML for compatibility across all email clients.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.college.name}")
    private String collegeName;

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("hh:mm a");

    /**
     * Send OTP verification email after registration.
     */
    @Async
    public void sendOtpEmail(String toEmail, String name, String otp, int expiryMinutes) {
        String subject = "Your Verification OTP - " + collegeName;
        String body = buildOtpEmailBody(name, otp, expiryMinutes);
        sendEmail(toEmail, subject, body);
    }

    /**
     * Send booking confirmation email after a successful booking.
     */
    @Async
    public void sendBookingConfirmationEmail(
            String toEmail, String name, String hallName, String hallLocation,
            String eventName, String department, LocalDate bookingDate,
            LocalTime startTime, LocalTime endTime) {

        String subject = "Booking Confirmed: " + eventName + " - " + collegeName;
        String body = buildBookingEmailBody(
            "Booking Confirmed! ✅", name, hallName, hallLocation,
            eventName, department, bookingDate, startTime, endTime,
            "#16a34a", "Your hall has been successfully reserved.",
            "If you need to make changes, please log in to the Hall Reservation System."
        );
        sendEmail(toEmail, subject, body);
    }

    /**
     * Send booking update email when a booking is modified.
     */
    @Async
    public void sendBookingUpdatedEmail(
            String toEmail, String name, String hallName, String hallLocation,
            String eventName, String department, LocalDate bookingDate,
            LocalTime startTime, LocalTime endTime) {

        String subject = "Booking Updated: " + eventName + " - " + collegeName;
        String body = buildBookingEmailBody(
            "Booking Updated ✏️", name, hallName, hallLocation,
            eventName, department, bookingDate, startTime, endTime,
            "#d97706", "Your booking has been updated with the new details.",
            "Please review the updated booking details above."
        );
        sendEmail(toEmail, subject, body);
    }

    /**
     * Send booking cancellation email.
     */
    @Async
    public void sendBookingCancelledEmail(
            String toEmail, String name, String hallName, String eventName,
            LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {

        String subject = "Booking Cancelled: " + eventName + " - " + collegeName;
        String body = buildCancellationEmailBody(
            name, hallName, eventName, bookingDate, startTime, endTime);
        sendEmail(toEmail, subject, body);
    }

    // ─── Private Helpers ────────────────────────────────────────────────────────

    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, collegeName + " Hall Reservation");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} | Subject: {}", to, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildOtpEmailBody(String name, String otp, int expiryMinutes) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f7f9;">
              <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:40px 32px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Velalar College of Engineering and Technology</h1>
                  <p style="color:#93c5fd;margin:8px 0 0;font-size:14px;">Smart Hall Reservation System</p>
                </div>
                <div style="padding:40px 32px;">
                  <h2 style="color:#1e293b;margin:0 0 8px;">Email Verification</h2>
                  <p style="color:#475569;margin:0 0 24px;">Hi <strong>%s</strong>, welcome to VCET Hall Reservation!</p>
                  <p style="color:#475569;margin:0 0 24px;">Use the OTP below to verify your email address:</p>
                  <div style="background:#f0f9ff;border:2px dashed #2563eb;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                    <p style="margin:0 0 8px;color:#475569;font-size:14px;">Your One-Time Password</p>
                    <h1 style="margin:0;font-size:48px;font-weight:800;letter-spacing:12px;color:#1e3a5f;">%s</h1>
                    <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Valid for %d minutes</p>
                  </div>
                  <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:4px;padding:12px 16px;margin:0 0 24px;">
                    <p style="margin:0;color:#92400e;font-size:13px;">⚠️ Do not share this OTP with anyone. Our team will never ask for it.</p>
                  </div>
                  <p style="color:#94a3b8;font-size:12px;margin:0;">If you did not request this, please ignore this email.</p>
                </div>
                <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;">© 2025 Velalar College of Engineering and Technology. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, otp, expiryMinutes);
    }

    private String buildBookingEmailBody(
            String title, String name, String hallName, String hallLocation,
            String eventName, String department, LocalDate bookingDate,
            LocalTime startTime, LocalTime endTime,
            String accentColor, String subtitle, String note) {

        return """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f7f9;">
              <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:40px 32px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Velalar College of Engineering and Technology</h1>
                  <p style="color:#93c5fd;margin:8px 0 0;font-size:14px;">Smart Hall Reservation System</p>
                </div>
                <div style="padding:40px 32px;">
                  <div style="display:inline-block;background:%s;color:#fff;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;margin-bottom:16px;">%s</div>
                  <h2 style="color:#1e293b;margin:0 0 4px;">%s</h2>
                  <p style="color:#475569;margin:0 0 24px;">Hi <strong>%s</strong>, %s</p>
                  <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
                    <table style="width:100%%;border-collapse:collapse;">
                      <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:40%%;">🏛️ Hall</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;">%s</td></tr>
                      <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">📍 Location</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">%s</td></tr>
                      <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">🎯 Event</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;">%s</td></tr>
                      <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">🏢 Department</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">%s</td></tr>
                      <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">📅 Date</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;">%s</td></tr>
                      <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">⏰ Time</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;">%s – %s</td></tr>
                    </table>
                  </div>
                  <p style="color:#94a3b8;font-size:13px;margin:0;">%s</p>
                </div>
                <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;">© 2025 Velalar College of Engineering and Technology. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                accentColor, title, eventName, name, subtitle,
                hallName, hallLocation, eventName, department,
                bookingDate.format(DATE_FORMATTER),
                startTime.format(TIME_FORMATTER), endTime.format(TIME_FORMATTER),
                note
            );
    }

    private String buildCancellationEmailBody(
            String name, String hallName, String eventName,
            LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f7f9;">
              <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:40px 32px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Velalar College of Engineering and Technology</h1>
                  <p style="color:#93c5fd;margin:8px 0 0;font-size:14px;">Smart Hall Reservation System</p>
                </div>
                <div style="padding:40px 32px;">
                  <div style="display:inline-block;background:#dc2626;color:#fff;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;margin-bottom:16px;">Booking Cancelled ❌</div>
                  <h2 style="color:#1e293b;margin:0 0 4px;">%s</h2>
                  <p style="color:#475569;margin:0 0 24px;">Hi <strong>%s</strong>, your booking has been successfully cancelled.</p>
                  <div style="background:#fef2f2;border-radius:12px;padding:24px;margin:0 0 24px;border:1px solid #fecaca;">
                    <table style="width:100%%;border-collapse:collapse;">
                      <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:40%%;">🏛️ Hall</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">%s</td></tr>
                      <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">📅 Date</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">%s</td></tr>
                      <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">⏰ Time</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">%s – %s</td></tr>
                    </table>
                  </div>
                  <p style="color:#475569;font-size:14px;">The slot is now available for others to book. You can make a new reservation anytime.</p>
                </div>
                <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;">© 2025 Velalar College of Engineering and Technology. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                eventName, name, hallName,
                bookingDate.format(DATE_FORMATTER),
                startTime.format(TIME_FORMATTER), endTime.format(TIME_FORMATTER)
            );
    }
}
