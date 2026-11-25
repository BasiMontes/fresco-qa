# Proyecto DOJO: menú semanal seguro para alérgicos (borrador)

Borrador de la página del proyecto para el portfolio (QAFRESCO-20). El texto entre corchetes lo rellenas tú; cada cifra sale del repositorio y nombra su fuente.

## Contexto

| Dato | Valor |
|---|---|
| Aplicación | Fresco, un planificador de menús semanales para familias, probado como caja negra |
| Funcionalidad | Menú semanal seguro para alérgicos: el menú excluye los alérgenos declarados y respeta la dieta |
| Rol | QA: análisis, pruebas exploratorias, automatización, CI y monitorización |
| Duración | Del 18 al 25 de noviembre de 2026, 8 días según el historial de git [responsable: confirma si cuentas desde otra fecha] |
| Tecnologías | Playwright, TypeScript, Bun, arquitectura KATA, zod, GitHub Actions, pila local de Supabase |

La funcionalidad no tenía historia ni especificación, así que los criterios de aceptación se derivaron del propio producto: 11 criterios más uno de seguridad (`docs/feature-test-plan.md`).

## Fase 1: análisis

- Un plan de pruebas de la funcionalidad con alcance, riesgos, personas y técnicas de diseño (particiones de equivalencia, valores límite, tablas de decisión, transición de estados).
- 18 casos de prueba, cada uno atado a un criterio y a una prioridad (`docs/test-cases.md`).
- Una matriz de trazabilidad que relaciona cada criterio con sus casos, sus comprobaciones automatizadas y los defectos encontrados, y muestra los huecos (`docs/traceability-matrix.md`).

## Fase 2: pruebas exploratorias

- Tres informes de sesión, uno de base de datos, uno de interfaz y uno de API (`docs/session-reports/`).
- 11 defectos con su gravedad y su nivel de evidencia, todos registrados en Jira, más un hallazgo que el product owner descartó por ser comportamiento previsto (`docs/bugs-found.md`).
- Ejemplos: una dieta vegana que guarda en silencio alérgenos que el usuario no eligió, y un menú que supera el presupuesto semanal sin mostrar ningún aviso.

## Fase 3: automatización, CI/CD y monitorización

| Resultado | Valor | Fuente |
|---|---|---|
| Tests de UI | 6 (UI-TC-01, 03, 05, 09, 11 y 14) | `kata-manifest.json` |
| Tests de API | 33 ATC en 12 ficheros, con el esquema de las respuestas validado | `docs/automation-eval.md` sección 1 |
| Casos de prueba automatizados | 11 de 18 | `docs/automation-eval.md` sección 2.1 |
| Ejecución de CI sobre base de datos limpia | 64 de 64 pasando, 0 saltados | Ejecución 45176908396 de GitHub Actions |
| Ejecución programada | Los tests también corren cada noche a las 03:00 UTC; se disparó sola el 24-nov-2026 y el job de API y UI pasó | `.github/workflows/tests.yml`, ejecución 45401081360 |
| Monitor sintético de staging | 4 comprobaciones cada 30 minutos | `docs/monitoring.md` |

Los tests no comparten estado: cada uno crea y borra su propio menú y restaura el perfil que modificó, y respetan el límite del producto de cinco generaciones de menú por usuario y hora.

## Aprendizajes

- La primera ejecución de CI sobre una base de datos vacía falló 2 de 43 tests. Una comprobación de aislamiento pasaba en local solo porque sesiones manuales anteriores habían dejado datos. Una ejecución de CI sobre una base nueva es la única prueba de que un test no depende de lo que dejó tu máquina.
- Un `testIgnore` de Playwright definido en un proyecto reemplaza al global en lugar de sumarse, y dejó algunos ficheros sin ejecutarse en ningún proyecto.
- Una revisión encontró credenciales escritas en los ficheros del informe. La corrección se comprobó con un inicio de sesión real y cero ficheros sensibles, y la página de resultados publicada es un resumen y no el informe completo.
- Añadir un test más que pide menús hizo fallar la CI con un 429 en otro test: el límite por usuario y hora es un recurso compartido que hay que presupuestar antes de escribir tests nuevos.
- Un test limitado por la cuota no debe dar «pasado»: por eso en local se informa como «no ejecutado» y en CI como fallo.

## Reflexión personal

Probar mi propio producto como caja negra, solo por su interfaz y su API, me enseñó que un test es tan bueno como el estado en el que corre: la primera ejecución de CI sobre una base limpia falló porque un test había pasado en local gracias a datos de sesiones manuales anteriores. Lo más valioso no fueron los 12 hallazgos registrados, sino decidir cuáles eran de verdad defectos: separar lo que hace el producto de lo que dice el requisito (BUG-01, BUG-04) me obligó a dejar por escrito los criterios de aceptación. AC-4, AC-6 y AC-7 se cerraron tarde y cada uno acabó en un test nuevo o en un defecto nuevo, así que la próxima vez haría esas preguntas antes de automatizar. Cuando el inicio de sesión de staging quedó bloqueado por un captcha, montar una pila local mantuvo los tests honestos y repetibles, en lugar de saltarme la protección.

## Enlaces

- Repositorio: https://github.com/BasiMontes/fresco-qa
- Página de resultados: https://basimontes.github.io/fresco-qa/
- Pipeline de CI: https://github.com/BasiMontes/fresco-qa/actions/workflows/tests.yml
- Tablero de Jira: https://basiliomontescastano.atlassian.net/jira/software/projects/QAFRESCO/boards/36
