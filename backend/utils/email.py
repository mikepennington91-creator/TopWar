"""Email utility functions."""
import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email settings
GMAIL_USER = os.environ.get('GMAIL_USER', '')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')


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
    subject = "Top War Moderator Application – Waitlist"
    body = f"""Hi {name},

Thank you for your application to become a Top War Moderator.

We're pleased to inform you that your application has been accepted. However, we currently do not have an open vacancy at this moment in time.

Your application has been placed on our waiting list and we will be in touch as soon as a position becomes available.

Thank you for your patience and continued interest in joining our moderation team.

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)


def send_application_waitlist_to_approved_email(to_email: str, name: str, manager_comment: str = ""):
    """Send email when a waitlisted application is converted to approved."""
    subject = "Top War Moderator Application – Position Available!"
    
    comment_section = ""
    if manager_comment and manager_comment.strip():
        comment_section = f"""
Message from the Training Team:
{manager_comment.strip()}

"""
    
    body = f"""Hi {name},

Great news! A position has become available and we'd like to offer you a place on our moderation team.

Your application, which was previously on our waiting list, has now been fully approved.

The next stage is an interview with the training team.

{comment_section}We look forward to hearing from you shortly.

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)
