"""Email utility functions with HTML templates."""
import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email settings
GMAIL_USER = os.environ.get('GMAIL_USER', '')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

TOP_WAR_LOGO = "https://www.rivergame.net/en/res/img/comm/home/topcover/title.png"
APPLY_URL = f"{FRONTEND_URL}/apply"


def _base_html(body_content: str) -> str:
    """Wrap body content in a branded HTML email template."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;">
<tr><td align="center" style="padding:24px 16px;">

<!-- Main Card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">

<!-- Header with logo -->
<tr>
<td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 40px 24px;text-align:center;border-bottom:2px solid #f59e0b;">
  <img src="{TOP_WAR_LOGO}" alt="Top War: Battle Game" width="280" style="max-width:280px;width:100%;height:auto;display:block;margin:0 auto;" />
  <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">Moderator Recruitment</p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:32px 40px;">
{body_content}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:20px 40px 28px;border-top:1px solid #334155;text-align:center;">
  <p style="margin:0 0 6px;font-size:12px;color:#64748b;">Top War Moderation Team</p>
  <p style="margin:0;font-size:11px;color:#475569;">Powered by RiverGames &bull; <a href="https://www.rivergame.net" style="color:#f59e0b;text-decoration:none;">rivergame.net</a></p>
</td>
</tr>

</table>
<!-- End Card -->

</td></tr>
</table>
</body>
</html>"""


def _heading(text: str, color: str = "#f59e0b") -> str:
    return f'<h2 style="margin:0 0 20px;font-size:22px;color:{color};font-weight:700;">{text}</h2>'


def _paragraph(text: str) -> str:
    return f'<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">{text}</p>'


def _greeting(name: str) -> str:
    return f'<p style="margin:0 0 20px;font-size:15px;color:#e2e8f0;">Hi <strong style="color:#f59e0b;">{name}</strong>,</p>'


def _comment_box(label: str, comment: str) -> str:
    """Render a highlighted message box for manager comments."""
    return f"""\
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
<tr><td style="background-color:#f59e0b10;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;">
  <p style="margin:0 0 6px;font-size:12px;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;font-weight:700;">{label}</p>
  <p style="margin:0;font-size:15px;line-height:1.6;color:#e2e8f0;font-style:italic;">{comment}</p>
</td></tr>
</table>"""


def _button(text: str, url: str, bg: str = "#f59e0b", fg: str = "#0f172a") -> str:
    return f"""\
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="border-radius:8px;background-color:{bg};">
  <a href="{url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:{fg};text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">{text}</a>
</td></tr>
</table>"""


def _sign_off() -> str:
    return '<p style="margin:24px 0 0;font-size:15px;color:#94a3b8;">Kind regards,<br><strong style="color:#cbd5e1;">Top War Moderation Team</strong></p>'


def send_email(to_email: str, subject: str, body_html: str):
    """Send HTML email via Gmail SMTP."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        logging.warning("Email credentials not configured, skipping email send")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg['From'] = GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body_html, 'html'))

        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)

        logging.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


# ──────────────────────────────────────────────
# Application Emails
# ──────────────────────────────────────────────

def send_application_confirmation_email(to_email: str, name: str):
    """Send confirmation email when application is submitted."""
    body = (
        _greeting(name)
        + _heading("Application Received")
        + _paragraph("Thank you for submitting your application to become a <strong>Top War Moderator</strong>. We have received your application and our team will review it shortly.")
        + _paragraph("You will receive an email once a decision has been made.")
        + _sign_off()
    )
    send_email(to_email, "Top War - Application Received", _base_html(body))


def send_application_approved_email(to_email: str, name: str, manager_comment: str = ""):
    """Send email when application is approved."""
    comment = ""
    if manager_comment and manager_comment.strip():
        comment = _comment_box("Message from the Training Team", manager_comment.strip())

    body = (
        _greeting(name)
        + _heading("Congratulations!", "#10b981")
        + _paragraph("We're pleased to let you know that your application to become a <strong>Top War Moderator</strong> has been successful!")
        + _paragraph("The next stage is an interview with the training team.")
        + comment
        + _paragraph("We look forward to hearing from you shortly.")
        + _sign_off()
    )
    send_email(to_email, "Top War Moderator Application \u2013 Congratulations!", _base_html(body))


def send_application_rejected_email(to_email: str, name: str, manager_comment: str = ""):
    """Send email when application is rejected."""
    comment = ""
    if manager_comment and manager_comment.strip():
        comment = _comment_box("Message from the Moderation Team", manager_comment.strip())

    body = (
        _greeting(name)
        + _heading("Application Update")
        + _paragraph("Thank you for taking the time to apply for a <strong>Top War Moderator</strong> position and for your interest in supporting the community.")
        + _paragraph("After careful review, we regret to inform you that your application has not been successful on this occasion. We received a strong number of applications, and this decision was not an easy one.")
        + comment
        + _paragraph("This does not reflect negatively on your enthusiasm or commitment to the game. We actively encourage you to continue developing your game knowledge and community engagement, and you are welcome to <strong>reapply in three months</strong> should you wish to do so.")
        + _button("Re-Apply When Ready", APPLY_URL)
        + _paragraph("Thank you again for your interest in the role and for being part of the Top War community. We wish you the best of luck moving forward and hope to see your application again in the future.")
        + _sign_off()
    )
    send_email(to_email, "Top War Moderator Application \u2013 Update", _base_html(body))


def send_application_waitlist_email(to_email: str, name: str):
    """Send email when application is placed on waiting list."""
    body = (
        _greeting(name)
        + _heading("You're On Our Waiting List!", "#eab308")
        + _paragraph("Great news! After reviewing your application, we're pleased to inform you that you've been accepted to join our moderation team.")
        + _paragraph("However, we're currently at full capacity and don't have an open position available right now. But don't worry \u2013 we've added you to our <strong>priority waiting list</strong>!")
        + _heading("What happens next?", "#94a3b8")
        + _paragraph("\u2022 Your application remains active and at the front of our queue<br>\u2022 As soon as a position becomes available, we'll reach out to you immediately<br>\u2022 You don't need to reapply \u2013 we've got you covered")
        + _paragraph("We were genuinely impressed with your application and are excited about the prospect of having you on the team. Thank you for your patience and continued interest in supporting the Top War community.")
        + _paragraph("We'll be in touch soon!")
        + _sign_off()
    )
    send_email(to_email, "Top War Moderator Application \u2013 You're On Our Waiting List!", _base_html(body))


def send_application_waitlist_to_approved_email(to_email: str, name: str, manager_comment: str = ""):
    """Send email when a waitlisted application is converted to approved."""
    comment = ""
    if manager_comment and manager_comment.strip():
        comment = _comment_box("Message from the Training Team", manager_comment.strip())

    body = (
        _greeting(name)
        + _heading("A Position Is Now Available!", "#10b981")
        + _paragraph("The wait is over \u2013 we have fantastic news for you!")
        + _paragraph("A position has opened up on our moderation team, and we'd love to officially welcome you aboard. Your patience while on our waiting list has been greatly appreciated, and we're thrilled to finally extend this offer to you.")
        + comment
        + _heading("What happens next?", "#94a3b8")
        + _paragraph("The next stage is an interview with the training team, where we'll get you set up and ready to start making a difference in the Top War community.")
        + _paragraph("Please keep an eye on your <strong>Discord DMs</strong>, as we'll be reaching out to schedule your interview shortly. Make sure you have DMs enabled so we can connect with you!")
        + _paragraph("Welcome to the team \u2013 we can't wait to work with you!")
        + _sign_off()
    )
    send_email(to_email, "Top War Moderator Application \u2013 A Position Is Now Available!", _base_html(body))


# ──────────────────────────────────────────────
# Moderator Emails
# ──────────────────────────────────────────────

def send_moderator_email_confirmation(to_email: str, username: str):
    """Send confirmation email when a moderator registers an email address."""
    body = (
        _greeting(username)
        + _heading("Email Confirmed")
        + _paragraph("Thanks for confirming your email address for the <strong>Top War Moderator Portal</strong>.")
        + _paragraph("We'll only use this email to help you reset your password if you ever forget it. We won't use it for marketing or unrelated notifications.")
        + _paragraph("If you did not submit this email address, please contact an administrator immediately.")
        + _sign_off()
    )
    send_email(to_email, "Top War Moderator Portal \u2013 Email Confirmed", _base_html(body))


def send_password_reset_email(to_email: str, username: str, reset_token: str):
    """Send password reset email with one-time reset link."""
    reset_link = f"{FRONTEND_URL}/moderator/reset-password?token={reset_token}"
    body = (
        _greeting(username)
        + _heading("Password Reset Request")
        + _paragraph("We received a request to reset your <strong>Top War Moderator Portal</strong> password.")
        + _paragraph("Use the button below to set a new password:")
        + _button("Reset My Password", reset_link)
        + _paragraph("This link will expire in <strong>1 hour</strong>. If you did not request this reset, you can safely ignore this message.")
        + _sign_off()
    )
    send_email(to_email, "Top War Moderator Portal \u2013 Password Reset Request", _base_html(body))
