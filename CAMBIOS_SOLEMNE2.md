# Mejoras para la Solemne 2

Cierra las brechas detectadas en el Control 4 y el Informe 2.

| Brecha | Cambio | Requerimiento |
|---|---|---|
| Umbrales fijos, sin calibración | Calibración personal de 10 s (mediana de rasgos invariantes a la escala) y botón "Recalibrar" | RF04 |
| La sensibilidad no se aplicaba | Presets baja/media/alta que se aplican al analizador | RF04 |
| Tiempo contado en fotogramas | Máquina de estados por tiempo real (`postureTracker.js`): 3 s sostenidos, 10 s entre alertas y tiempos en segundos | RF05, RF07 |
| Descanso visual fijo en 20 min | Usa el intervalo configurado; el estiramiento también | RF06 |
| Sin consentimiento informado | Pantalla de consentimiento antes de la primera sesión | RF02 |
| Mensaje de privacidad impreciso | Ahora dice que en la nube se guardan solo métricas resumidas | RNF01 |
| Sin derecho de eliminación | "Eliminar mis datos" en Configuración (Firestore + local) | RF08 |
| Reglas de Firestore no versionadas | `firestore.rules`: solo el dueño accede y solo se aceptan métricas | RNF02 |
| Logro "Maratón" (>1 h frente a pantalla) | Reemplazado por "Ojos descansados" (3 pausas cumplidas) | Impacto negativo 5 |
| Sin línea base para el piloto | Modo observación: mide sin alertar (semana 0) | Indicador I1 |
| Sin registro de adherencia | Pausas visuales mostradas y cumplidas por sesión | Indicador I3b |
| "Entendido" en la alerta borraba las estadísticas | Ahora solo oculta el aviso | Bug |
| Botón cerrar del resumen llamaba a `window.close` | Corregido | Bug |
| Sin pruebas | 17 pruebas con Vitest (`npm test`) | RNF08 |

**Pendiente manual:** publicar `firestore.rules` en la consola de Firebase (Firestore → Reglas) o con `firebase deploy --only firestore:rules`.
