# Cloud_EF

Web de estudio para el **Examen Final de CS2032 Cloud Computing**, hecha solo con las diapositivas de [`Clases/`](Clases/).

## Contenido

- **Aprende**: las 6 clases (Bases de Datos, Multi-tenancy, Serverless, Optimización de Lambdas, Monitoreo y Arquitectura basada en eventos), explicadas desde cero con sus diagramas y la diapositiva de donde sale cada dato.
- **Servicios**: qué hace cada servicio de AWS que aparece en clase, cuándo usarlo y en qué ejemplo sale, más una guía rápida “necesito… → uso…”.
- **Diagramas**: método para dibujar una arquitectura de solución y 7 casos con solución, incluidos los 3 temas del proyecto (clínicas, camiones IoT y asistencia multi-tenant).
- **Práctica**: 69 preguntas de opción múltiple y las 21 preguntas de cierre del profesor, con respuesta modelo.
- **Simulacros**: 3 exámenes con tiempo (opción múltiple, preguntas abiertas y un diagrama).

- **Chat de IA** (botón 💬 en todas las páginas): responde preguntas con el material de clase, cita la diapositiva y puede revisar el diagrama que armaste en el editor. Usa Claude (`claude-opus-5-5`) con **tu propia clave de API de Anthropic**, que se guarda solo en tu navegador; el repositorio no contiene ninguna clave. Cada pregunta se cobra a esa cuenta. Se desactiva durante los simulacros.

Lo que no sale de las diapositivas está marcado como *fuera de las diapositivas* o *decisión de diseño*.

## Uso

Es una web estática, sin compilación. Abre `index.html` en el navegador o sírvela localmente:

```sh
python3 -m http.server 8000   # luego abre http://localhost:8000
```

También funciona con GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).
