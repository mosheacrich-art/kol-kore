import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'

function getSections(lang) {
  const es = lang === 'es'
  return [
    {
      title: es ? '1. Responsable del tratamiento' : '1. Data Controller',
      body: es
        ? <p>El responsable del tratamiento de los datos personales recogidos a través de esta aplicación es{' '}
            <strong style={{ color: 'var(--text)' }}>PerashApp</strong> (perashapp.com).
            Contacto: <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.
          </p>
        : <p>The data controller for personal data collected through this application is{' '}
            <strong style={{ color: 'var(--text)' }}>PerashApp</strong> (perashapp.com).
            Contact: <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.
          </p>
    },
    {
      title: es ? '2. Datos que recopilamos' : '2. Data We Collect',
      body: es
        ? <><p>Recogemos únicamente los datos necesarios para prestar el servicio:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'disc' }}>
              <li><strong>Cuenta:</strong> nombre, dirección de email y contraseña (almacenada cifrada).</li>
              <li><strong>Perfil:</strong> fecha de Bar/Bat Mitzvá, perashá asignada, progreso de estudio.</li>
              <li><strong>Grabaciones de audio:</strong> archivos de voz subidos voluntariamente para practicar la lectura.</li>
              <li><strong>Datos de uso:</strong> tiempo de estudio por aliyá, rachas de estudio, número de escuchas.</li>
              <li><strong>Pago:</strong> las suscripciones se gestionan a través de Apple In-App Purchase. No almacenamos datos de tarjeta ni información de pago.</li>
            </ul></>
        : <><p>We collect only the data necessary to provide the service:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'disc' }}>
              <li><strong>Account:</strong> name, email address and password (stored encrypted).</li>
              <li><strong>Profile:</strong> Bar/Bat Mitzvah date, assigned parasha, study progress.</li>
              <li><strong>Audio recordings:</strong> voice files voluntarily uploaded to practice Torah reading.</li>
              <li><strong>Usage data:</strong> study time per aliyah, study streaks, number of listens.</li>
              <li><strong>Payment:</strong> subscriptions are managed through Apple In-App Purchase. We do not store card details or payment information.</li>
            </ul></>
    },
    {
      title: es ? '3. Finalidad y base legal' : '3. Purpose and Legal Basis',
      body: es
        ? <table className="w-full text-sm mt-2 border-collapse">
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--text)' }}>Finalidad</th>
              <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Base legal</th>
            </tr></thead>
            <tbody>
              {[
                ['Prestar el servicio de estudio y seguimiento', 'Ejecución del contrato'],
                ['Gestionar suscripciones a través de Apple', 'Ejecución del contrato'],
                ['Notificaciones entre profesor y alumno', 'Interés legítimo'],
                ['Mejorar la plataforma', 'Interés legítimo'],
                ['Cumplimiento de obligaciones legales', 'Obligación legal'],
              ].map(([fin, base], i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="py-2 pr-4">{fin}</td>
                  <td className="py-2 text-xs" style={{ color: 'var(--text-3)' }}>{base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        : <table className="w-full text-sm mt-2 border-collapse">
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--text)' }}>Purpose</th>
              <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Legal basis</th>
            </tr></thead>
            <tbody>
              {[
                ['Provide the study and tracking service', 'Contract performance'],
                ['Manage subscriptions through Apple', 'Contract performance'],
                ['Notifications between teacher and student', 'Legitimate interest'],
                ['Improve the platform', 'Legitimate interest'],
                ['Compliance with legal obligations', 'Legal obligation'],
              ].map(([fin, base], i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="py-2 pr-4">{fin}</td>
                  <td className="py-2 text-xs" style={{ color: 'var(--text-3)' }}>{base}</td>
                </tr>
              ))}
            </tbody>
          </table>
    },
    {
      title: es ? '4. Conservación de datos' : '4. Data Retention',
      body: es
        ? <p>Conservamos los datos mientras la cuenta esté activa. Tras la cancelación, los eliminamos en un plazo máximo de 90 días, salvo obligación legal de conservación (ej. facturas: 5 años según normativa fiscal española).</p>
        : <p>We retain data while the account is active. After cancellation, we delete it within a maximum of 90 days, unless legally required to retain it (e.g. invoices: 5 years under Spanish tax regulations).</p>
    },
    {
      title: es ? '5. Destinatarios' : '5. Recipients',
      body: es
        ? <><p>Compartimos datos únicamente con los siguientes proveedores de servicios, bajo contrato de encargado del tratamiento:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'disc' }}>
              <li><strong>Supabase Inc.</strong> — base de datos y autenticación (servidores en UE).</li>
              <li><strong>Apple Inc.</strong> — gestión de suscripciones y pagos a través de In-App Purchase.</li>
              <li><strong>OpenAI LLC</strong> — transcripción de audio para la sincronización de lectura (modelo Whisper). Los audios se procesan y no se utilizan para entrenar modelos.</li>
            </ul>
            <p className="mt-2">No vendemos ni cedemos datos a terceros con fines comerciales.</p></>
        : <><p>We share data only with the following service providers, under a data processing agreement:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'disc' }}>
              <li><strong>Supabase Inc.</strong> — database and authentication (EU servers).</li>
              <li><strong>Apple Inc.</strong> — subscription and payment management through In-App Purchase.</li>
              <li><strong>OpenAI LLC</strong> — audio transcription for reading synchronization (Whisper model). Audio is processed and not used to train AI models.</li>
            </ul>
            <p className="mt-2">We do not sell or share data with third parties for commercial purposes.</p></>
    },
    {
      title: es ? '6. Transferencias internacionales' : '6. International Transfers',
      body: es
        ? <p>Algunos proveedores (OpenAI, Apple) tienen sede en EE.UU. Las transferencias se realizan bajo las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea o bajo el marco EU-U.S. Data Privacy Framework.</p>
        : <p>Some providers (OpenAI, Apple) are based in the USA. Transfers are made under Standard Contractual Clauses approved by the European Commission or under the EU-U.S. Data Privacy Framework.</p>
    },
    {
      title: es ? '7. Tus derechos (RGPD)' : '7. Your Rights (GDPR)',
      body: es
        ? <><p>Como residente en la UE tienes derecho a:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'disc' }}>
              <li><strong>Acceso:</strong> saber qué datos tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos incorrectos.</li>
              <li><strong>Supresión:</strong> solicitar el borrado de tu cuenta y datos.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
              <li><strong>Oposición y limitación:</strong> limitar ciertos tratamientos.</li>
            </ul>
            <p className="mt-2">Para ejercer tus derechos, escríbenos a{' '}
              <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.
              También puedes reclamar ante la <strong>Agencia Española de Protección de Datos</strong> (aepd.es).
            </p></>
        : <><p>As a resident in the EU you have the right to:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'disc' }}>
              <li><strong>Access:</strong> know what data we hold about you.</li>
              <li><strong>Rectification:</strong> correct inaccurate data.</li>
              <li><strong>Erasure:</strong> request deletion of your account and data.</li>
              <li><strong>Portability:</strong> receive your data in a structured format.</li>
              <li><strong>Objection and restriction:</strong> limit certain processing.</li>
            </ul>
            <p className="mt-2">To exercise your rights, contact us at{' '}
              <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.
              You may also lodge a complaint with the <strong>Spanish Data Protection Agency</strong> (aepd.es).
            </p></>
    },
    {
      title: 'Cookies',
      body: es
        ? <p>Usamos únicamente cookies técnicas necesarias para el funcionamiento de la sesión (almacenadas en localStorage via Supabase Auth). No usamos cookies de seguimiento ni publicidad.</p>
        : <p>We only use technical cookies necessary for session functionality (stored in localStorage via Supabase Auth). We do not use tracking or advertising cookies.</p>
    },
    {
      title: es ? '9. Seguridad' : '9. Security',
      body: es
        ? <p>Los datos se transmiten cifrados mediante TLS. Las contraseñas se almacenan con hash bcrypt. Los archivos de audio se guardan en almacenamiento privado con acceso controlado por permisos de usuario.</p>
        : <p>Data is transmitted encrypted via TLS. Passwords are stored with bcrypt hashing. Audio files are stored in private storage with user permission-controlled access.</p>
    },
    {
      title: es ? '10. Cambios en esta política' : '10. Changes to This Policy',
      body: es
        ? <p>Notificaremos cambios significativos por email con al menos 30 días de antelación. El uso continuado del servicio tras esa fecha implica la aceptación de la nueva versión.</p>
        : <p>We will notify significant changes by email at least 30 days in advance. Continued use of the service after that date implies acceptance of the new version.</p>
    },
  ]
}

export default function Privacy() {
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
          {es ? 'Política de Privacidad' : 'Privacy Policy'}
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
