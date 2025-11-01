await resend.emails.send({
  from: 'PorVerse <onboarding@resend.dev>',
  to: toEmail,
  subject: 'Your PorVerse subscription is active',
  react: ReceiptEmail({ /* props */ }), // Aici cere @react-email/render (de asta trebuia instalat)
})
