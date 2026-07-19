import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const emailFrom = `"${process.env.SMTP_FROM_NAME || "TrainerFlow"}" <${
  process.env.SMTP_FROM_EMAIL || "noreply@trainerflow.com"
}>`;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://trainerflow-uy.netlify.app";

export function verificationEmail(to: string, actionLink: string) {
  return transporter.sendMail({
    from: emailFrom,
    to,
    subject: "Confirmá tu cuenta en TrainerFlow",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#13131a;color:#e0e0e0;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7c6cf0;color:#fff;font-weight:800;font-size:20px;padding:10px 18px;border-radius:10px;">TF</div>
        </div>
        <h2 style="color:#fff;text-align:center;margin-bottom:8px;">Confirmá tu correo</h2>
        <p style="color:#a0a0a0;text-align:center;font-size:14px;margin-bottom:24px;">
          Hacé clic en el botón para activar tu cuenta en TrainerFlow.
        </p>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${actionLink}" style="display:inline-block;background:#7c6cf0;color:#fff;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px;">
            Confirmar correo
          </a>
        </div>
        <p style="color:#666;font-size:12px;text-align:center;">
          Si no creaste esta cuenta, ignorá este mensaje.
        </p>
      </div>
    `,
  });
}

export function recoveryEmail(to: string, actionLink: string) {
  return transporter.sendMail({
    from: emailFrom,
    to,
    subject: "Recuperá tu contraseña - TrainerFlow",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#13131a;color:#e0e0e0;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7c6cf0;color:#fff;font-weight:800;font-size:20px;padding:10px 18px;border-radius:10px;">TF</div>
        </div>
        <h2 style="color:#fff;text-align:center;margin-bottom:8px;">Cambiá tu contraseña</h2>
        <p style="color:#a0a0a0;text-align:center;font-size:14px;margin-bottom:24px;">
          Recibimos una solicitud para cambiar tu contraseña.
        </p>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${actionLink}" style="display:inline-block;background:#7c6cf0;color:#fff;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px;">
            Cambiar contraseña
          </a>
        </div>
        <p style="color:#666;font-size:12px;text-align:center;">
          Si no realizaste esta solicitud, ignorá este mensaje.
        </p>
      </div>
    `,
  });
}
