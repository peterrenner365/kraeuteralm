export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, contact, interests } = req.body;

    if (!name || !contact) {
      return res.status(400).json({ error: 'Name und Kontakt sind erforderlich' });
    }

    if (process.env.RESEND_API_KEY) {
      const interestLines = Array.isArray(interests) && interests.length
        ? interests.map((i) => `- ${i}`).join('\n')
        : 'nicht angegeben';

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Kräuteralm <onboarding@resend.dev>',
          to: ['peterrenner10@t-online.de'],
          subject: `Neue Anmeldung: Herbst-Startliste – ${name}`,
          text: `Neue Anmeldung zur Herbst-Startliste\n\nVorname: ${name}\nKontakt: ${contact}\n\nInteressiert an:\n${interestLines}`
        })
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
