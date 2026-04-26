import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function Privacy() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const bg = isDark ? '#07060f' : '#f5f0e4'

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs mb-10 px-4 py-2 rounded-full transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M8 2L3 6.5l5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>

        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>Legal</p>
        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Política de Privacidad
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-3)' }}>
          Última actualización: abril de 2025
        </p>

        <div className="flex flex-col gap-8" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>

          <Section title="1. Responsable del tratamiento">
            <p>
              El responsable del tratamiento de los datos personales recogidos a través de esta aplicación es{' '}
              <strong style={{ color: 'var(--text)' }}>[Nombre / Empresa]</strong>,
              con domicilio en [Dirección], España.
              Contacto: <a href="mailto:[email]" style={{ color: '#6c33e6' }}>[email de contacto]</a>.
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <p>Recogemos únicamente los datos necesarios para prestar el servicio:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'disc' }}>
              <li><strong>Cuenta:</strong> nombre, dirección de email y contraseña (almacenada cifrada).</li>
              <li><strong>Perfil:</strong> fecha de Bar/Bat Mitzvá, perashá asignada, progreso de estudio.</li>
              <li><strong>Grabaciones de audio:</strong> archivos de voz subidos voluntariamente para practicar la lectura.</li>
              <li><strong>Datos de uso:</strong> tiempo de estudio por aliyá, rachas de estudio, número de escuchas.</li>
              <li><strong>Pago:</strong> los datos de pago son procesados directamente por Stripe. No almacenamos números de tarjeta.</li>
            </ul>
          </Section>

          <Section title="3. Finalidad y base legal">
            <table className="w-full text-sm mt-2 border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--text)' }}>Finalidad</th>
                  <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Base legal</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Prestar el servicio de estudio y seguimiento', 'Ejecución del contrato'],
                  ['Gestionar pagos y suscripciones', 'Ejecución del contrato'],
                  ['Notificaciones entre profesor y alumno', 'Interés legítimo'],
                  ['Mejorar la plataforma', 'Interés legítimo'],
                  ['Cumplimiento de obligaciones legales', 'Obligación legal'],
                ].map(([fin, base], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="py-2 pr-4">{fin}</td>
                    <td className="py-2 text-xs px-2 py-1 rounded" style={{ color: 'var(--text-3)' }}>{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. Conservación de datos">
            <p>
              Conservamos los datos mientras la cuenta esté activa. Tras la cancelación, los eliminamos en un plazo máximo de
              90 días, salvo obligación legal de conservación (ej. facturas: 5 años según normativa fiscal española).
            </p>
          </Section>

          <Section title="5. Destinatarios">
            <p>Compartimos datos únicamente con los siguientes proveedores de servicios, bajo contrato de encargado del tratamiento:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'disc' }}>
              <li><strong>Supabase Inc.</strong> — base de datos y autenticación (servidores en UE).</li>
              <li><strong>Stripe Inc.</strong> — procesamiento de pagos.</li>
              <li><strong>OpenAI LLC</strong> — transcripción de audio para la sincronización de lectura (modelo Whisper). Los audios se procesan y no se utilizan para entrenar modelos.</li>
            </ul>
            <p className="mt-2">No vendemos ni cedemos datos a terceros con fines comerciales.</p>
          </Section>

          <Section title="6. Transferencias internacionales">
            <p>
              Algunos proveedores (OpenAI, Stripe) tienen sede en EE.UU. Las transferencias se realizan bajo
              las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea o bajo el marco EU-U.S. Data Privacy Framework.
            </p>
          </Section>

          <Section title="7. Tus derechos (RGPD)">
            <p>Como residente en la UE tienes derecho a:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4" style={{ listStyleType: 'disc' }}>
              <li><strong>Acceso:</strong> saber qué datos tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos incorrectos.</li>
              <li><strong>Supresión:</strong> solicitar el borrado de tu cuenta y datos.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
              <li><strong>Oposición y limitación:</strong> limitar ciertos tratamientos.</li>
            </ul>
            <p className="mt-2">
              Para ejercer tus derechos, escríbenos a{' '}
              <a href="mailto:[email]" style={{ color: '#6c33e6' }}>[email de contacto]</a>.
              También puedes reclamar ante la <strong>Agencia Española de Protección de Datos</strong> (aepd.es).
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              Usamos únicamente cookies técnicas necesarias para el funcionamiento de la sesión (almacenadas en localStorage
              via Supabase Auth). No usamos cookies de seguimiento ni publicidad.
            </p>
          </Section>

          <Section title="9. Seguridad">
            <p>
              Los datos se transmiten cifrados mediante TLS. Las contraseñas se almacenan con hash bcrypt.
              Los archivos de audio se guardan en almacenamiento privado con acceso controlado por permisos de usuario.
            </p>
          </Section>

          <Section title="10. Cambios en esta política">
            <p>
              Notificaremos cambios significativos por email con al menos 30 días de antelación.
              El uso continuado del servicio tras esa fecha implica la aceptación de la nueva versión.
            </p>
          </Section>

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
