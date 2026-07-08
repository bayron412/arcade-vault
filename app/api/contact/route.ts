import { Resend } from "resend";

type ContactPayload = {
  name: string;
  email: string;
  msg: string;
};

export async function POST(request: Request) {
  const { name, email, msg } = (await request.json()) as ContactPayload;

  if (!name || !email || !msg) {
    return Response.json(
      { error: "Todos los campos son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.CONTACT_EMAIL_TO!,
      subject: `Nuevo mensaje de contacto — ${name}`,
      html: `<p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Mensaje:</strong> ${msg}</p>`,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido.";
    return Response.json({ error: message }, { status: 500 });
  }
}
