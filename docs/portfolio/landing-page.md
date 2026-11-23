# Borrador: cambios en la landing (QAFRESCO-22 y QAFRESCO-20)

La landing `https://basimontes.github.io/` ya cubre cuatro de las cinco secciones que pide la tarjeta. El repositorio de la web no está en este espacio de trabajo, así que aquí solo hay el texto para pegar.

| Sección pedida | Estado en la web | Acción |
|---|---|---|
| About | Cubierta: titular, bio y bloque de estado | Ninguna |
| Skills | Cubierta: Aptitudes | Ninguna |
| Projects | Cubierta: Retos de calidad (5) | Añadir el reto de este proyecto |
| Certifications | No existe | Añadir la sección |
| Contact | Cubierta | Ninguna |

## Nuevo reto: proyecto del Dojo (QAFRESCO-20)

**Menú sin alérgenos** (Fresco). Estado: terminado.

Pruebas de caja negra de un planificador de menús semanales: el menú debe excluir los alérgenos declarados y respetar la dieta. Como la funcionalidad no tenía especificación, derivé 11 criterios de aceptación y uno de seguridad, escribí un plan de pruebas y 18 casos, y los trazé a sus pruebas automáticas y a los defectos encontrados. Automaticé 6 pruebas de UI y 21 de API con la arquitectura KATA en Playwright y TypeScript, con un workflow de CI que levanta el producto en limpio: 51 de 51 pruebas pasan, y se ejecuta también cada noche. Además, un monitor sintético de 4 comprobaciones cada 30 minutos. Encontré 9 defectos candidatos, 5 ya registrados en Jira.

Aprendí que una prueba que pasa en local puede depender de datos que dejaron sesiones manuales: la primera ejecución en una base de datos limpia falló 2 de 43.

Etiquetas: Playwright, TypeScript, KATA, CI/CD.
Enlaces: [repositorio](https://github.com/BasiMontes/fresco-qa) · [resultados](https://basimontes.github.io/fresco-qa/).

## Nueva sección: Certificaciones

| Certificación | Entidad | Estado |
|---|---|---|
| Dojo Agentic Quality Engineer | UPEX Galaxy | Añadir fecha y enlace al certificado cuando lo descargues |

Mientras no tengas el certificado, la sección puede decir solo "En curso", igual que tu entrada de Formación.

## Una cosa que revisar

La entrada de Formación dice "Edición #3, mayo a julio 2026". Si tu ceremonia de certificación es en noviembre, puede que ese rango esté desactualizado.
