"""Email utility functions."""
import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email settings
GMAIL_USER = os.environ.get('GMAIL_USER', '')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')


def send_email(to_email: str, subject: str, body: str):
    """Send email via Gmail SMTP."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        logging.warning("Email credentials not configured, skipping email send")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        
        logging.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def send_application_confirmation_email(to_email: str, name: str):
    """Send confirmation email when application is submitted."""
    subject = "Top War - Application Received"
    body = f"""Hi {name},

Thank you for submitting your application to become a Top War Moderator. We have received your application and our team will review it shortly. You will receive an email once a decision has been made.

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)


def send_application_approved_email(to_email: str, name: str, manager_comment: str = ""):
    """Send email when application is approved."""
    subject = "Top War Moderator Application – Congratulations!"
    
    # Build the comment section if a comment is provided
    comment_section = ""
    if manager_comment and manager_comment.strip():
        comment_section = f"""
Message from the Training Team:
{manager_comment.strip()}

"""
    
    body = f"""Hi {name},

Congratulations! We're pleased to let you know that your application to become a Top War Moderator has been successful.

The next stage is an interview with the training team.

{comment_section}We look forward to hearing from you shortly.

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)


def send_application_rejected_email(to_email: str, name: str):
    """Send email when application is rejected."""
    subject = "Top War Moderator Application – Update"
    body = f"""Hi {name},

Thank you for taking the time to apply for a Top War Moderator position and for your interest in supporting the community.

After careful review, we regret to inform you that your application has not been successful on this occasion. We received a strong number of applications, and this decision was not an easy one.

This does not reflect negatively on your enthusiasm or commitment to the game. We actively encourage you to continue developing your game knowledge and community engagement, and you are welcome to reapply in three months should you wish to do so.

Thank you again for your interest in the role and for being part of the Top War community. We wish you the best of luck moving forward and hope to see your application again in the future.

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)


def send_application_waitlist_email(to_email: str, name: str):
    """Send email when application is placed on waiting list."""
    subject = "Top War Moderator Application – You're On Our Waiting List!"
    body = f"""Hi {name},

Great news! After reviewing your application, we're pleased to inform you that you've been accepted to join our moderation team.

However, we're currently at full capacity and don't have an open position available right now. But don't worry – we've added you to our priority waiting list!

What happens next?
• Your application remains active and at the front of our queue
• As soon as a position becomes available, we'll reach out to you immediately
• You don't need to reapply – we've got you covered

We were genuinely impressed with your application and are excited about the prospect of having you on the team. Thank you for your patience and continued interest in supporting the Top War community.

We'll be in touch soon!

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)


def send_application_waitlist_to_approved_email(to_email: str, name: str, manager_comment: str = ""):
    """Send email when a waitlisted application is converted to approved."""
    subject = "Top War Moderator Application – A Position Is Now Available! 🎉"
    
    comment_section = ""
    if manager_comment and manager_comment.strip():
        comment_section = f"""
Message from the Training Team:
{manager_comment.strip()}

"""
    
    body = f"""Hi {name},

The wait is over – we have fantastic news for you!

A position has opened up on our moderation team, and we'd love to officially welcome you aboard. Your patience while on our waiting list has been greatly appreciated, and we're thrilled to finally extend this offer to you.

{comment_section}What happens next?
The next stage is an interview with the training team, where we'll get you set up and ready to start making a difference in the Top War community.

Please keep an eye on your Discord DMs, as we'll be reaching out to schedule your interview shortly. Make sure you have DMs enabled so we can connect with you!

Welcome to the team – we can't wait to work with you!

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)


def send_moderator_email_confirmation(to_email: str, username: str):
    """Send confirmation email when a moderator registers an email address."""
    subject = "Top War Moderator Portal – Email Confirmed"
    body = f"""Hi {username},

Thanks for confirming your email address for the Top War Moderator Portal.

We'll only use this email to help you reset your password if you ever forget it. We won't use it for marketing or unrelated notifications.

If you did not submit this email address, please contact an administrator immediately.

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)


def send_password_reset_email(to_email: str, username: str, reset_token: str):
    """Send password reset email with one-time reset link."""
    reset_link = f"{FRONTEND_URL}/moderator/reset-password?token={reset_token}"
    subject = "Top War Moderator Portal – Password Reset Request"
    body = f"""Hi {username},

We received a request to reset your Top War Moderator Portal password.

Use the link below to set a new password:
{reset_link}

This link will expire in 1 hour. If you did not request this reset, you can safely ignore this message.

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)
