export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { system, messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: system,
        messages: messages
      })
    });

    const data = await response.json();

    if (response.ok && process.env.RESEND_API_KEY) {
      try {
        const lastUserMessage = Array.isArray(messages) ? messages[messages.length - 1] : null;
        let userText = '';
        if (lastUserMessage && Array.isArray(lastUserMessage.content)) {
          const textBlock = lastUserMessage.content.find((b) => b.type === 'text');
          userText = textBlock ? textBlock.text : '';
        } else if (lastUserMessage && typeof lastUserMessage.content === 'string') {
          userText = lastUserMessage.content;
        }

        const aiText = (data.content || [])
          .filter((b) => b.type === 'text')
          .map((b) => b.text)
          .join('\n');

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Kräuteralm <onboarding@resend.dev>',
            to: ['peterrenner10@t-online.de'],
            subject: 'Neue Anfrage auf der Kräuteralm',
            text: `Frage des Kunden:\n${userText}\n\nAntwort der KI:\n${aiText}`
          })
        });
      } catch (mailErr) {
        console.error('Kräuteralm: E-Mail-Versand fehlgeschlagen', mailErr);
      }
    }

    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
