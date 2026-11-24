# Cloud_EF

Web de estudio para el **Examen Final de CS2032 Cloud Computing**, hecha con las diapositivas de [`Clases/`](Clases/). La sección **Casos examen** agrega conocimiento general de AWS que no está en las diapositivas, y está marcado así.

## Contenido

- **Aprende**: las 6 clases (Bases de Datos, Multi-tenancy, Serverless, Optimización de Lambdas, Monitoreo y Arquitectura basada en eventos), explicadas desde cero con sus diagramas y la diapositiva de donde sale cada dato.
- **Servicios**: qué hace cada servicio de AWS que aparece en clase, cuándo usarlo y en qué ejemplo sale, más una guía rápida “necesito… → uso…”.
- **Diagramas**: método para dibujar una arquitectura de solución y 7 casos con solución, incluidos los 3 temas del proyecto (clínicas, camiones IoT y asistencia multi-tenant).
- **Editor**: arma tu diagrama de arquitectura (servicios, flechas y etiquetas) y se corrige solo: servicios clave, conexiones esperadas y buenas prácticas de clase, cada una con su diapositiva.
- **Casos examen**: problemas con el formato del examen (VPC, subnets públicas y privadas, NAT, VPC Endpoints, VPN/Direct Connect, Secrets Manager, patrón Saga, idempotencia, tablas DynamoDB con PK/SK, microservicios con ECS/EC2). Incluye 3 ejemplos resueltos y 3 problemas de práctica que se arman en el editor con zonas (VPC, subnets, on-premise). Este contenido es conocimiento general de AWS, no sale de las diapositivas, y está marcado así en la web.
- **Práctica**: 69 preguntas de opción múltiple y las 21 preguntas de cierre del profesor, con respuesta modelo.
- **Simulacros**: 3 exámenes con tiempo (opción múltiple, preguntas abiertas y un diagrama).

Lo que no sale de las diapositivas está marcado como *fuera de las diapositivas* o *decisión de diseño*.

## Uso

Es una web estática, sin compilación. Abre `index.html` en el navegador o sírvela localmente:

```sh
python3 -m http.server 8000   # luego abre http://localhost:8000
```

También funciona con GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).
