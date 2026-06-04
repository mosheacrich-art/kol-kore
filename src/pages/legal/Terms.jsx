import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'

function getSections(lang) {
  const es = lang === 'es'
  return [
    {
      title: es ? '1. Descripción del servicio' : '1. Service Description',
      body: es
        ? <><p>Perashá es una plataforma de estudio de Torá que permite a alumnos estudiar las parashot semanales con texto, audio sincronizado y seguimiento de progreso, y a profesores gestionar alumnos, asignar deberes y subir grabaciones de referencia.</p>
            <p className="mt-2">Prestada por <strong style={{ color: 'var(--text)' }}>PerashApp</strong> (perashapp.com). Contacto: <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.</p></>
        : <><p>Perashá is a Torah study platform that allows students to study weekly parashot with text, synchronized audio and progress tracking, and teachers to manage students, assign homework and upload reference recordings.</p>
            <p className="mt-2">Provided by <strong style={{ color: 'var(--text)' }}>PerashApp</strong> (perashapp.com). Contact: <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.</p></>
    },
    {
      title: es ? '2. Registro y cuenta' : '2. Registration and Account',
      body: es
        ? <><p>Para acceder al servicio es necesario crear una cuenta con email y contraseña o usar el acceso de invitado (sin registro). Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad que se realice desde tu cuenta.</p>
            <p className="mt-2">Debes proporcionar información veraz. Nos reservamos el derecho de cancelar cuentas que incumplan estos términos.</p></>
        : <><p>To access the service you must create an account with email and password or use guest access (no registration required). You are responsible for maintaining the confidentiality of your password and all activity carried out from your account.</p>
            <p className="mt-2">You must provide accurate information. We reserve the right to cancel accounts that violate these terms.</p></>
    },
    {
      title: es ? '3. Prueba gratuita' : '3. Free Trial',
      body: es
        ? <p>Los nuevos alumnos disponen de <strong style={{ color: 'var(--text)' }}>7 días de acceso completo gratuito</strong>{' '}desde el momento del registro. No se requiere tarjeta de crédito para iniciar la prueba. Al finalizar el periodo de prueba, el acceso se limita hasta que se active una suscripción de pago.</p>
        : <p>New students have <strong style={{ color: 'var(--text)' }}>7 days of full free access</strong>{' '}from the time of registration. No credit card is required to start the trial. At the end of the trial period, access is limited until a paid subscription is activated.</p>
    },
    {
      title: es ? '4. Precios y pagos' : '4. Pricing and Payments',
      body: es
        ? <><div className="mt-1 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-card)' }}>
                <tr>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Plan</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Precio</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Acceso</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3">Mensual</td><td className="px-4 py-3">$9,99 / mes</td><td className="px-4 py-3">30 días</td>
                </tr>
                <tr style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3">Anual</td><td className="px-4 py-3">$99,99 / año</td><td className="px-4 py-3">12 meses (ahorra 17%)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">Los pagos en la aplicación iOS son gestionados por Apple a través de las compras integradas de la App Store (In-App Purchase). Al suscribirte aceptas también los{' '}
            <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer" style={{ color: '#6c33e6' }}>Términos de Licencia de Usuario Final de Apple</a>.
          </p></>
        : <><div className="mt-1 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-card)' }}>
                <tr>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Plan</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Price</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Access</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3">Monthly</td><td className="px-4 py-3">$9.99 / month</td><td className="px-4 py-3">30 days</td>
                </tr>
                <tr style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3">Annual</td><td className="px-4 py-3">$99.99 / year</td><td className="px-4 py-3">12 months (save 17%)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">Payments within the iOS app are managed by Apple through App Store In-App Purchase. By subscribing you also accept{' '}
            <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer" style={{ color: '#6c33e6' }}>Apple's End User License Agreement</a>.
          </p></>
    },
    {
      title: es ? '5. Renovación automática y cancelación' : '5. Auto-Renewal and Cancellation',
      body: es
        ? <div className="p-4 rounded-xl mt-1 flex items-start gap-3" style={{ background: 'rgba(108,51,230,0.07)', border: '1px solid rgba(108,51,230,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="8" cy="8" r="6.5" stroke="#6c33e6" strokeWidth="1.3"/>
              <path d="M8 5v4M8 10.5v.5" stroke="#6c33e6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p>La suscripción se <strong style={{ color: 'var(--text)' }}>renueva automáticamente</strong> al final de cada periodo salvo que se cancele al menos 24 horas antes. La renovación se carga a través de tu cuenta de Apple ID.{' '}
              <strong style={{ color: 'var(--text)' }}>Para cancelar</strong>, ve a Ajustes → tu nombre → Suscripciones en tu dispositivo iOS. No se reembolsan los periodos ya cobrados.</p>
          </div>
        : <div className="p-4 rounded-xl mt-1 flex items-start gap-3" style={{ background: 'rgba(108,51,230,0.07)', border: '1px solid rgba(108,51,230,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="8" cy="8" r="6.5" stroke="#6c33e6" strokeWidth="1.3"/>
              <path d="M8 5v4M8 10.5v.5" stroke="#6c33e6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p>The subscription <strong style={{ color: 'var(--text)' }}>renews automatically</strong> at the end of each period unless cancelled at least 24 hours before. The renewal is charged to your Apple ID account.{' '}
              <strong style={{ color: 'var(--text)' }}>To cancel</strong>, go to Settings → your name → Subscriptions on your iOS device. No refunds are given for periods already charged.</p>
          </div>
    },
    {
      title: es ? '6. Política de reembolsos' : '6. Refund Policy',
      body: es
        ? <p>Los reembolsos de compras realizadas a través de Apple se gestionan conforme a la política de Apple. Para solicitar un reembolso, visita{' '}
            <a href="https://reportaproblem.apple.com" target="_blank" rel="noreferrer" style={{ color: '#6c33e6' }}>reportaproblem.apple.com</a>.
            Para cualquier incidencia técnica del servicio contacta con{' '}
            <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.
          </p>
        : <p>Refunds for purchases made through Apple are handled in accordance with Apple's policy. To request a refund, visit{' '}
            <a href="https://reportaproblem.apple.com" target="_blank" rel="noreferrer" style={{ color: '#6c33e6' }}>reportaproblem.apple.com</a>.
            For any service technical issue contact{' '}
            <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.
          </p>
    },
    {
      title: es ? '7. Contenido generado por el usuario' : '7. User-Generated Content',
      body: es
        ? <p>Las grabaciones de audio que subes son tuyas. Nos concedes una licencia limitada para almacenarlas y procesarlas (transcripción con Whisper) con el único fin de prestar el servicio. No las usamos para entrenar modelos de IA ni las compartimos con terceros salvo con los proveedores indicados en la Política de Privacidad.</p>
        : <p>The audio recordings you upload are yours. You grant us a limited licence to store and process them (Whisper transcription) solely for the purpose of providing the service. We do not use them to train AI models nor share them with third parties except with the providers indicated in the Privacy Policy.</p>
    },
    {
      title: es ? '8. Uso aceptable' : '8. Acceptable Use',
      body: es
        ? <><p>Está prohibido usar el servicio para:</p>
            <ul className="mt-2 flex flex-col gap-1 pl-4" style={{ listStyleType: 'disc' }}>
              <li>Compartir credenciales de acceso con terceros.</li>
              <li>Intentar acceder a cuentas o datos de otros usuarios.</li>
              <li>Subir contenido que vulnere derechos de terceros o la legislación aplicable.</li>
              <li>Realizar ingeniería inversa o reproducir el servicio.</li>
            </ul></>
        : <><p>You may not use the service to:</p>
            <ul className="mt-2 flex flex-col gap-1 pl-4" style={{ listStyleType: 'disc' }}>
              <li>Share access credentials with third parties.</li>
              <li>Attempt to access other users' accounts or data.</li>
              <li>Upload content that infringes third-party rights or applicable law.</li>
              <li>Reverse engineer or reproduce the service.</li>
            </ul></>
    },
    {
      title: es ? '9. Disponibilidad del servicio' : '9. Service Availability',
      body: es
        ? <p>Nos esforzamos por mantener el servicio disponible 24/7 pero no garantizamos disponibilidad ininterrumpida. El texto de la Torá se obtiene de la API de Sefaria; interrupciones en ese servicio externo están fuera de nuestro control.</p>
        : <p>We strive to keep the service available 24/7 but do not guarantee uninterrupted availability. Torah text is obtained from the Sefaria API; interruptions to that external service are beyond our control.</p>
    },
    {
      title: es ? '10. Limitación de responsabilidad' : '10. Limitation of Liability',
      body: es
        ? <p>En la medida permitida por la ley, nuestra responsabilidad total frente al usuario no superará el importe pagado en los últimos 12 meses. No somos responsables de pérdidas indirectas, pérdida de datos o interrupciones del servicio causadas por terceros.</p>
        : <p>To the extent permitted by law, our total liability to the user shall not exceed the amount paid in the last 12 months. We are not liable for indirect losses, data loss or service interruptions caused by third parties.</p>
    },
    {
      title: es ? '11. Modificaciones de los términos' : '11. Modifications to Terms',
      body: es
        ? <p>Podemos modificar estos términos notificándolo por email con 30 días de antelación. El uso continuado del servicio tras ese plazo implica la aceptación de los nuevos términos.</p>
        : <p>We may modify these terms by notifying you by email 30 days in advance. Continued use of the service after that period implies acceptance of the new terms.</p>
    },
    {
      title: es ? '12. Ley aplicable y jurisdicción' : '12. Applicable Law and Jurisdiction',
      body: es
        ? <p>Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales del domicilio del usuario (según normativa de consumidores).</p>
        : <p>These terms are governed by Spanish law. For any dispute, the parties submit to the courts of the user's domicile (in accordance with consumer regulations).</p>
    },
  ]
}

export default function Terms() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const { lang } = useLang()
  const bg = isDark ? '#07060f' : '#f5f0e4'
  const es = lang === 'es'

  const sections = getSections(lang)

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs mb-10 px-4 py-2 rounded-full transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M8 2L3 6.5l5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {es ? 'Volver' : 'Back'}
        </button>

        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>Legal</p>
        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          {es ? 'Términos y Condiciones' : 'Terms and Conditions'}
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-3)' }}>
          {es ? 'Última actualización: junio de 2025' : 'Last updated: June 2025'}
        </p>

        <div className="flex flex-col gap-8" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
          {sections.map((s, i) => (
            <Section key={i} title={s.title}>{s.body}</Section>
          ))}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>{title}</h2>
      <div className="text-sm" style={{ color: 'var(--text-2)' }}>{children}</div>
    </div>
  )
}
