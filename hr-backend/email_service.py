import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()


def send_reset_email(to_email: str, reset_token: str, user_name: str) -> bool:
    """
    Send a password reset email to the user.
    Returns True if sent successfully, False otherwise.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    frontend_url = os.getenv("FRONTEND_URL", "https://hrms-cbn.vercel.app").rstrip("/")

    # If App Password has spaces, also create a stripped version
    smtp_password_clean = smtp_password.replace(" ", "")

    if not smtp_user or not smtp_password:
        print("[EMAIL ERROR] SMTP_USER or SMTP_PASSWORD environment variable is missing!")
        return False

    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    subject = "Reset Kata Sandi — Aplikasi HR"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#f97316,#f59e0b);padding:32px 40px;text-align:center;">
                                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                                    🔐 Reset Kata Sandi
                                </h1>
                                <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
                                    Aplikasi HR — PT Cybers Blitz Nusantara
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Body -->
                        <tr>
                            <td style="padding:32px 40px;">
                                <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                                    Halo <strong>{user_name}</strong>,
                                </p>
                                <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                                    Kami menerima permintaan untuk mereset kata sandi akun Anda. Klik tombol di bawah ini untuk membuat kata sandi baru.
                                </p>
                                
                                <!-- Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding:8px 0 24px;">
                                            <a href="{reset_link}" 
                                               style="display:inline-block;background:linear-gradient(135deg,#f97316,#f59e0b);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
                                                Reset Kata Sandi →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="margin:0 0 16px;color:#9ca3af;font-size:12px;line-height:1.6;">
                                    Atau salin link berikut ke browser Anda:
                                </p>
                                <p style="margin:0 0 24px;background-color:#f8fafc;padding:12px 16px;border-radius:8px;font-size:11px;color:#6b7280;word-break:break-all;border:1px solid #e5e7eb;">
                                    {reset_link}
                                </p>
                                
                                <!-- Warning -->
                                <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:10px;padding:14px 18px;margin-bottom:8px;">
                                    <p style="margin:0;color:#92400e;font-size:12px;line-height:1.5;">
                                        ⚠️ <strong>Link ini berlaku selama 15 menit.</strong> Jika Anda tidak meminta reset kata sandi, abaikan email ini. Akun Anda tetap aman.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color:#f8fafc;padding:20px 40px;border-top:1px solid #f3f4f6;">
                                <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;line-height:1.5;">
                                    Email ini dikirim secara otomatis oleh sistem.<br/>
                                    © 2026 Aplikasi HR — PT Cybers Blitz Nusantara
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Aplikasi HR <{smtp_user}>"
    msg["To"] = to_email

    # Plain text fallback
    plain_text = f"""
Halo {user_name},

Kami menerima permintaan untuk mereset kata sandi akun Anda.
Klik link berikut untuk membuat kata sandi baru:

{reset_link}

Link ini berlaku selama 15 menit.
Jika Anda tidak meminta reset kata sandi, abaikan email ini.

— Aplikasi HR, PT Cybers Blitz Nusantara
    """

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    # Attempt 1: Standard TLS (Port 587)
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password_clean)
            server.sendmail(smtp_user, to_email, msg.as_string())
        print(f"[EMAIL SUCCESS] Reset email sent to {to_email} via port {smtp_port}")
        return True
    except Exception as e_tls:
        print(f"[EMAIL WARN] TLS (port {smtp_port}) failed: {e_tls}. Trying SSL (port 465)...")
        
        # Attempt 2: Direct SSL (Port 465)
        try:
            with smtplib.SMTP_SSL(smtp_host, 465, timeout=10) as server_ssl:
                server_ssl.ehlo()
                server_ssl.login(smtp_user, smtp_password_clean)
                server_ssl.sendmail(smtp_user, to_email, msg.as_string())
            print(f"[EMAIL SUCCESS] Reset email sent to {to_email} via port 465 SSL")
            return True
        except Exception as e_ssl:
            print(f"[EMAIL ERROR] Both TLS and SSL failed to send email to {to_email}: {e_ssl}")
            return False

