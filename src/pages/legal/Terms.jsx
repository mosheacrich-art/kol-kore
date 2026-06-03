import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function Terms() {
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
          Términos y Condiciones
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-3)' }}>
          Última actualización: junio de 2025
        </p>

        <div className="flex flex-col gap-8" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>

          <Section title="1. Descripción del servicio">
            <p>
              Perashá es una plataforma de estudio de Torá que permite a alumnos estudiar las parashot semanales
              con texto, audio sincronizado y seguimiento de progreso, y a profesores gestionar alumnos, asignar
              deberes y subir grabaciones de referencia.
            </p>
            <p className="mt-2">
              Prestada por <strong style={{ color: 'var(--text)' }}>PerashApp</strong> (perashapp.com).
              Contacto: <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.
            </p>
          </Section>

          <Section title="2. Registro y cuenta">
            <p>
              Para acceder al servicio es necesario crear una cuenta con email y contraseña o usar el acceso
              de invitado (sin registro). Eres responsable de mantener la confidencialidad de tu contraseña
              y de toda actividad que se realice desde tu cuenta.
            </p>
            <p className="mt-2">
              Debes proporcionar información veraz. Nos reservamos el derecho de cancelar cuentas que
              incumplan estos términos.
            </p>
          </Section>

          <Section title="3. Prueba gratuita">
            <p>
              Los nuevos alumnos disponen de <strong style={{ color: 'var(--text)' }}>7 días de acceso completo gratuito</strong>{' '}
              desde el momento del registro. No se requiere tarjeta de crédito para iniciar la prueba.
              Al finalizar el periodo de prueba, el acceso se limita hasta que se active una suscripción de pago.
            </p>
          </Section>

          <Section title="4. Precios y pagos">
            <div className="mt-1 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
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
                    <td className="px-4 py-3">Mensual</td>
                    <td className="px-4 py-3">$9,99 / mes</td>
                    <td className="px-4 py-3">30 días</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3">Anual</td>
                    <td className="px-4 py-3">$99,99 / año</td>
                    <td className="px-4 py-3">12 meses (ahorra 17%)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Los pagos en la aplicación iOS son gestionados por Apple a través de las compras integradas
              de la App Store (In-App Purchase). Al suscribirte aceptas también los{' '}
              <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer" style={{ color: '#6c33e6' }}>
                Términos de Licencia de Usuario Final de Apple
              </a>.
            </p>
          </Section>

          <Section title="5. Renovación automática y cancelación">
            <div className="p-4 rounded-xl mt-1 flex items-start gap-3"
              style={{ background: 'rgba(108,51,230,0.07)', border: '1px solid rgba(108,51,230,0.2)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="8" cy="8" r="6.5" stroke="#6c33e6" strokeWidth="1.3"/>
                <path d="M8 5v4M8 10.5v.5" stroke="#6c33e6" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>
                La suscripción se <strong style={{ color: 'var(--text)' }}>renueva automáticamente</strong> al final de cada
                periodo salvo que se cancele al menos 24 horas antes. La renovación se carga a través de tu cuenta de Apple ID.{' '}
                <strong style={{ color: 'var(--text)' }}>Para cancelar</strong>, ve a Ajustes → tu nombre → Suscripciones en
                tu dispositivo iOS. No se reembolsan los periodos ya cobrados.
              </p>
            </div>
          </Section>

          <Section title="6. Política de reembolsos">
            <p>
              Los reembolsos de compras realizadas a través de Apple se gestionan conforme a la política de
              Apple. Para solicitar un reembolso, visita{' '}
              <a href="https://reportaproblem.apple.com" target="_blank" rel="noreferrer" style={{ color: '#6c33e6' }}>
                reportaproblem.apple.com
              </a>.
              Para cualquier incidencia técnica del servicio contacta con{' '}
              <a href="mailto:contact.perashapp@gmail.com" style={{ color: '#6c33e6' }}>contact.perashapp@gmail.com</a>.
            </p>
          </Section>

          <Section title="7. Contenido generado por el usuario">
            <p>
              Las grabaciones de audio que subes son tuyas. Nos concedes una licencia limitada para almacenarlas
              y procesarlas (transcripción con Whisper) con el único fin de prestar el servicio. No las usamos
              para entrenar modelos de IA ni las compartimos con terceros salvo con los proveedores indicados en
              la Política de Privacidad.
            </p>
          </Section>

          <Section title="8. Uso aceptable">
            <p>Está prohibido usar el servicio para:</p>
            <ul className="mt-2 flex flex-col gap-1 pl-4" style={{ listStyleType: 'disc' }}>
              <li>Compartir credenciales de acceso con terceros.</li>
              <li>Intentar acceder a cuentas o datos de otros usuarios.</li>
              <li>Subir contenido que vulnere derechos de terceros o la legislación aplicable.</li>
              <li>Realizar ingeniería inversa o reproducir el servicio.</li>
            </ul>
          </Section>

          <Section title="9. Disponibilidad del servicio">
            <p>
              Nos esforzamos por mantener el servicio disponible 24/7 pero no garantizamos disponibilidad
              ininterrumpida. El texto de la Torá se obtiene de la API de Sefaria; interrupciones en ese
              servicio externo están fuera de nuestro control.
            </p>
          </Section>

          <Section title="10. Limitación de responsabilidad">
            <p>
              En la medida permitida por la ley, nuestra responsabilidad total frente al usuario no superará
              el importe pagado en los últimos 12 meses. No somos responsables de pérdidas indirectas,
              pérdida de datos o interrupciones del servicio causadas por terceros.
            </p>
          </Section>

          <Section title="11. Modificaciones de los términos">
            <p>
              Podemos modificar estos términos notificándolo por email con 30 días de antelación.
              El uso continuado del servicio tras ese plazo implica la aceptación de los nuevos términos.
            </p>
          </Section>

          <Section title="12. Ley aplicable y jurisdicción">
            <p>
              Estos términos se rigen por la legislación española. Para cualquier controversia, las partes
              se someten a los juzgados y tribunales del domicilio del usuario (según normativa de consumidores).
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
