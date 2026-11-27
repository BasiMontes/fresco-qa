# Plan de 30 días y primer post (QAFRESCO-28)

El plan quedó aprobado el 2026-11-26. El post sigue en borrador y el certificado no consta como obtenido.

## Checklist de cierre

| Criterio de la tarjeta | Estado | Quién |
|---|---|---|
| Certificado descargado | Pendiente | Tú |
| LinkedIn actualizado con la certificación | Pendiente. El texto está en [linkedin.md](linkedin.md) | Tú |
| Entrada en el canal de alumni | Pendiente | Tú |
| Primer post sobre la experiencia | Borrador abajo, sin publicar | Tú |
| Plan de 30 días | Aprobado el 2026-11-26 | Hecho |

## Plan del 1 al 30 de diciembre de 2026

Las semanas 1 y 2 consolidan lo hecho. Las semanas 3 y 4 lo aplican.

| Semana | Foco | Tareas | Se da por hecha cuando |
|---|---|---|---|
| 1 (del 1 al 7) | Consolidar: contar el proyecto | Ensayar los decks en español e inglés con cronómetro. Publicar titular y "Acerca de" en LinkedIn (QAFRESCO-21). Descargar el certificado, entrar en el canal de alumni y publicar el post | Los dos decks tienen tiempo medido, LinkedIn está actualizado y el post está publicado |
| 2 (del 8 al 14) | Consolidar: cerrar defectos | Automatizar TC-17 para la semana actual y la siguiente (las pruebas de QAFRESCO-2 y QAFRESCO-36 pasaron el 2026-11-26 y el 2026-11-27). A 2026-11-27 queda abierto QAFRESCO-38 (textos del catálogo) | TC-17 tiene prueba en verde en CI para las dos semanas. Hecho el 2026-11-27 (run 45979520910) |
| 3 (del 15 al 21) | Aplicar: ampliar cobertura | Automatizar TC-07, TC-12 y TC-16, que no son manuales por diseño. Antes, fijar la regla de escalado de TC-07 y una cuenta desechable para TC-12 | Cada caso tiene su prueba en verde en CI, o una nota con el motivo por el que sigue sin automatizar. TC-16 automatizado y en verde en CI el 2026-11-27 (run 45991044433); TC-12 automatizado el 2026-11-27; falta TC-07 |
| 4 (del 22 al 30) | Aplicar: llevarlo a otro contexto | Elegir una práctica del proyecto (CI sobre base de datos limpia o matriz de trazabilidad) y probarla en otro proyecto o en el trabajo. Escribir una retrospectiva corta | Hay un ejemplo aplicado y la retrospectiva está escrita |

## Primer post (LinkedIn)

> He terminado el proyecto final del Dojo Agentic Quality Engineer de UPEX Galaxy. Probé como caja negra Fresco, un planificador de menús semanales que construyo yo, centrado en una promesa delicada: el menú no debe incluir los alérgenos que declaras.
>
> No había especificación, así que derivé los criterios de aceptación, diseñé 18 casos y automaticé pruebas de interfaz y de API con Playwright y TypeScript.
>
> La lección que me llevo llegó con la primera ejecución en CI sobre una base de datos vacía. Fallaron 2 de 43 tests. Uno pasaba en mi máquina solo porque sesiones manuales anteriores habían dejado datos. Una prueba vale lo que vale el estado en el que se ejecuta.
>
> El caso completo, con el repositorio y los resultados: https://basimontes.github.io/fresco-qa.html
>
> #QA #Playwright #TypeScript #Testing
