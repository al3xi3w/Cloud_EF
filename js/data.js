/* Contenido tomado de las diapositivas en Clases/. Cada dato lleva su fuente:
   BD = Almacenamiento y Bases de Datos (Semana 7)      MT = Multi-tenancy (Semana 9)
   SV = Arquitectura sin servidor (Semana 10)          LM = Optimización de Lambdas (Semana 11)
   MO = Monitoreo de Infraestructura y Aplicaciones (Semana 12)
   EV = Arquitectura basada en eventos (Semana 13) */

const DECKS = {
  BD: { name: 'Almacenamiento y Bases de Datos – Teoría 2', week: 'Semana 7', file: 'Clases/1. Almacenamiento y Bases de Datos - Teoría 2 - V1.10.pdf' },
  MT: { name: 'Multi-tenancy – Teoría', week: 'Semana 9', file: 'Clases/Multi-tenancy - Teoría - V1.00.pdf' },
  SV: { name: 'Arquitectura sin servidor (serverless) – Teoría', week: 'Semana 10', file: 'Clases/1. Arquitectura sin servidor (serverless) - Teoría - V1.20.pdf' },
  LM: { name: 'Serverless – Optimización de Lambdas', week: 'Semana 11', file: 'Clases/1. Serverless - Optimiz. Lambdas - V1.30.pdf' },
  MO: { name: 'Monitoreo de Infraestructura y Aplicaciones', week: 'Semana 12', file: 'Clases/1a. Monitoreo de Infraestructura y Aplicaciones - Teoría - V1.00.pdf' },
  EV: { name: 'Arquitectura basada en eventos – Teoría', week: 'Semana 13', file: 'Clases/Arquitectura basada en eventos - Teoría - V1.01.pdf' },
};

const CATS = {
  cliente:     { name: 'Cliente / actor', color: 'var(--c-cliente)' },
  computo:     { name: 'Cómputo', color: 'var(--c-computo)' },
  integracion: { name: 'Integración de la aplicación', color: 'var(--c-integracion)' },
  datos:       { name: 'Almacén de datos', color: 'var(--c-datos)' },
  monitoreo:   { name: 'Monitoreo', color: 'var(--c-monitoreo)' },
  ml:          { name: 'Machine Learning', color: 'var(--c-ml)' },
  web:         { name: 'Web / frontend / usuarios', color: 'var(--c-web)' },
};

/* ───────────── CATÁLOGO DE SERVICIOS ─────────────
   que: lo que dice la diapositiva · cuando: cuándo usarlo (según los ejemplos de clase)
   ejemplos: dónde aparece en clase · casos: cómo encaja en los casos del proyecto
   fuera: true si las diapositivas solo lo muestran en un diagrama sin describirlo */
const SERVICES = [
  { id: 'lambda', name: 'AWS Lambda', cat: 'computo',
    que: '“Servicio informático basado en los eventos y de pago por uso que le permite ejecutar código sin aprovisionar ni administrar servidores.”',
    src: 'SV p.11',
    cuando: [
      'Para la <b>lógica de negocio</b> detrás de una API (junto con API Gateway).',
      'Para <b>procesar un archivo apenas se sube</b> a S3 (el evento de S3 dispara la Lambda).',
      'Para <b>procesar datos de streaming</b> que llegan por Kinesis (IoT, clics, redes sociales).',
      'Para <b>backends</b> web, móviles, IoT y de API de terceros.',
      'Como pasos de un flujo de trabajo orquestado con Step Functions.',
    ],
    datos: [
      'Memoria: de <b>128 MB a 10 240 MB</b>, en incrementos de 1 MB (LM p.5).',
      'La CPU se asigna <b>en proporción a la memoria</b>; con <b>1769 MB</b> tiene el equivalente a <b>1 vCPU</b>; con 10 GB hasta <b>6 vCPU</b> (LM p.5–6).',
      'Tiempo máximo de ejecución: <b>900 segundos (15 minutos)</b> (LM p.8).',
      'Concurrencia por defecto: <b>1000 ejecuciones simultáneas</b> por cuenta, sumando todas las funciones de una región (LM p.12).',
    ],
    ejemplos: ['ToDo App: addTodo, completeTodo, deleteTodo, getAllTodo, getTodo, updateTodo (SV p.15)', 'Conversión Markdown→HTML y análisis de sentimiento (SV p.16)', 'Redimensionar fotos subidas a S3 (SV p.19)', 'Tendencias de hashtags desde Kinesis (SV p.20)', 'App del clima: lee DynamoDB y responde (SV p.21)', 'Sensores de tractor: detecta anomalías y pide repuestos (SV p.22)', 'Busca la lista de amigos y envía la notificación (SV p.23)'],
  },
  { id: 'fargate', name: 'AWS Fargate', cat: 'computo',
    que: '“Motor informático sin servidor que funciona tanto con Amazon Elastic Container Service (ECS) como con Amazon Elastic Kubernetes Service (EKS).”',
    src: 'SV p.11',
    cuando: ['Es la otra opción de <b>cómputo serverless</b> que muestra la clase, pensada para quien ejecuta <b>contenedores</b> (ECS/EKS) en vez de funciones.'],
    ejemplos: ['Solo aparece en la lista de servicios de cómputo serverless (SV p.11).'],
  },
  { id: 'apigw', name: 'Amazon API Gateway', cat: 'integracion',
    que: '“Servicio completamente administrado que facilita la creación y la publicación de API a cualquier escala.”',
    src: 'SV p.12',
    cuando: [
      'Es la <b>puerta de entrada</b> cuando un usuario, una app móvil o un dispositivo hace una <b>llamada REST</b> y espera respuesta (“App makes REST API call to endpoint”).',
      'Con Lambda, sirve para <b>autenticar y procesar solicitudes de API</b> en backends móviles (SV p.23).',
    ],
    ejemplos: ['ToDo API (SV p.15)', 'App del clima (SV p.21)', 'Actualización de estado en una red social (SV p.23)'],
  },
  { id: 'appsync', name: 'AWS AppSync', cat: 'integracion',
    que: '“Servicio completamente administrado que acelera el desarrollo de aplicaciones con API escalables de GraphQL.”',
    src: 'SV p.12',
    cuando: ['Cuando la API es <b>GraphQL</b> en lugar de REST.'],
    ejemplos: ['Solo aparece en la lista de integración (SV p.12).'],
  },
  { id: 'eventbridge', name: 'Amazon EventBridge', cat: 'integracion',
    que: '“Bus de eventos sin servidor que le permite crear aplicaciones basadas en los eventos y escalar en AWS y los sistemas existentes.”',
    src: 'SV p.12 · EV p.12',
    cuando: [
      'Se recomienda <b>cuando quiere crear una aplicación que reaccione a los eventos de las aplicaciones SaaS, los servicios de AWS o las aplicaciones personalizadas</b> (EV p.12).',
      'Usa un <b>esquema predefinido</b> para los eventos y permite crear <b>reglas que se aplican a todo el cuerpo del evento para filtrarlo</b> antes de enviarlo a los consumidores (EV p.12).',
      'Es el <b>enrutador para fan out</b> entre microservicios, con reglas de ruteo y filtrado (EV p.18–19).',
      'También sirve para <b>programar flujos de trabajo de forma recurrente</b> con una regla (SV p.17).',
    ],
    datos: ['Lanzado en julio de 2019 (EV p.12).'],
    ejemplos: ['Order service → EventBridge → Invoice / Fulfillment / Forecasting (EV p.18–19)', 'Regla recurrente que lanza el ETL de calidad del aire (SV p.17)'],
  },
  { id: 'sns', name: 'Amazon SNS', cat: 'integracion',
    que: '“Amazon Simple Notification Service (SNS) es un servicio de mensajería completamente administrado para la comunicación de aplicación a aplicación (A2A) y de aplicación a persona (A2P).”',
    src: 'SV p.12 · EV p.12',
    cuando: [
      'Se recomienda para <b>eventos de alto rendimiento y baja latencia</b> publicados por otras aplicaciones, microservicios o servicios de AWS, o para apps que necesitan una <b>gran difusión (miles o millones de puntos de conexión)</b> (EV p.12).',
      'Funciona con <b>temas</b> (topics). Los temas de SNS son <b>independientes del esquema</b> de eventos que se publiquen (EV p.12).',
      'Es la pieza del patrón <b>pub/sub</b>: cuando quieres <b>enviar un mensaje a muchos receptores</b> (EV p.20).',
      'Para <b>notificar a personas</b>: email, SMS y notificaciones móviles (EV p.22).',
    ],
    datos: [
      '<b>Quién publica</b> (ejemplos de la clase): CloudWatch Alarms, AWS Budgets, Lambda, Auto Scaling Group, S3 Bucket (eventos), DynamoDB, CloudFormation, AWS DMS, RDS Events (EV p.22).',
      '<b>Suscriptores</b>: SQS, Lambda, Kinesis Data Firehose, Emails, SMS y notificaciones móviles, endpoints HTTP(S) (EV p.22).',
    ],
    ejemplos: ['Buying Service → SNS Topic → Email / Fraud / Shipping / SQS (EV p.20)', 'SNS + SQS: Fan Out (EV p.21)', 'Notificación “nuevo objeto creado” en S3 que reparte a 2 colas (SV p.16)', 'Avisar a los amigos de un usuario (SV p.23)', 'Email al terminar el ETL (SV p.17)'],
  },
  { id: 'sqs', name: 'Amazon SQS', cat: 'integracion',
    que: '“Amazon Simple Queue Service (SQS) es un servicio de colas de mensajes que permite desacoplar y escalar los microservicios, los sistemas distribuidos y las aplicaciones sin servidor.”',
    src: 'SV p.12',
    cuando: [
      'Para comunicación <b>asíncrona</b>: “application to queue to application” (EV p.15).',
      'Para que el productor no espere al consumidor: el mensaje queda en la cola hasta que se procese.',
      'Como suscriptor de un tema SNS, una cola por cada servicio consumidor (<b>SNS + SQS: Fan Out</b>, EV p.21).',
      'Como <b>Dead Letter Queue</b> donde caen los mensajes cuya Lambda falló (SV p.16).',
    ],
    ejemplos: ['Buying Service → Queue → Shipping Service (EV p.15)', 'Conversion Service SQS queue y Sentiment Analysis SQS queue (SV p.16)', 'Add to SQS queue → Analyze (SV p.18)'],
  },
  { id: 'dlq', name: 'Dead Letter Queue (DLQ)', cat: 'integracion',
    que: 'En el diagrama de procesamiento de datos, cuando una Lambda falla (“Lambda Function Execution Failures”), el mensaje se envía a una <b>Dead Letter queue</b>; una <b>alarma de CloudWatch</b> (“DLQ has messages”) dispara una <b>notificación por email con SNS</b>.',
    src: 'SV p.16', fuera: 'diagrama',
    cuando: ['Para <b>no perder mensajes</b> que fallaron y <b>enterarse</b> (alarma + email) de que algo falló.'],
    ejemplos: ['Ramas de conversión y de sentimiento en el ejemplo Markdown (SV p.16)'],
  },
  { id: 'stepfunctions', name: 'AWS Step Functions', cat: 'integracion',
    que: '“Organizador visual de flujos de trabajo que facilita la secuenciación de múltiples servicios de AWS en aplicaciones fundamentales para las empresas.”',
    src: 'SV p.12',
    cuando: ['Cuando hay <b>varios pasos en orden</b> (ETL, procesamiento por lotes): obtener, procesar en paralelo, esperar, agregar, limpiar, notificar.'],
    ejemplos: ['Flujo ETL de calidad del aire: Get file inventory → Process files (x2) → Wait 10 seconds → Aggregate results → Delete intermediate results → SNS (SV p.17)'],
  },
  { id: 'kinesis', name: 'Amazon Kinesis', cat: 'integracion',
    que: '“Captures and streams the sensor data for processing by Lambda.” Se usa con Lambda “para procesar datos de streaming en tiempo real”.',
    src: 'SV p.20, p.22',
    cuando: [
      'Cuando los datos <b>llegan continuamente</b> (streaming) y hay que procesarlos en tiempo real.',
      'Usos listados en clase: seguimiento de la actividad de las aplicaciones, procesamiento de pedidos de transacciones, análisis de flujo de clics, limpieza de datos, filtrado de logs, indexación, análisis de medios sociales, <b>telemetría de datos de dispositivos IoT</b> y medición (SV p.20).',
    ],
    ejemplos: ['Stream de redes sociales → Kinesis → Lambda → DynamoDB (SV p.20)', 'Sensores de tractor → Kinesis → Lambda → pedido de repuestos (SV p.22)'],
  },
  { id: 's3', name: 'Amazon S3', cat: 'datos',
    que: '“Amazon Simple Storage Service (Amazon S3) es un servicio de almacenamiento de objetos diseñado para almacenar y proteger cualquier cantidad de datos.”',
    src: 'SV p.13',
    cuando: [
      'Para guardar <b>archivos</b>: fotos, documentos (PDF, DOCX, JPG), Markdown, resultados.',
      'Sus <b>eventos</b> (p. ej. “new object created”) pueden <b>desencadenar Lambda o SNS</b> para procesar datos en tiempo real después de una carga (SV p.16, p.19).',
      'Para <b>alojar el front-end estático</b> de una web (“Front-end code for weather app is hosted in S3”, SV p.21).',
    ],
    ejemplos: ['Source / Output S3 Bucket (SV p.16)', 'Documents, Staging y Queued bucket (SV p.18)', 'Foto subida a S3 → Lambda redimensiona (SV p.19)', 'OpenAQ data, intermediate results, final output (SV p.17)'],
  },
  { id: 'efs', name: 'Amazon EFS', cat: 'datos',
    que: '“Un sistema de archivos totalmente elástico y sin servidor que facilita la configuración, la escalabilidad y la optimización de costos del almacenamiento compartido de alta disponibilidad.”',
    src: 'SV p.13',
    cuando: ['Cuando varias Lambdas necesitan un <b>sistema de archivos compartido</b>: “conéctese a un sistema de archivos de Amazon EFS existente para habilitar el acceso compartido masivamente paralelo para el procesamiento de archivos a gran escala” (SV p.19).'],
    ejemplos: ['Procesamiento de archivos (SV p.19)'],
  },
  { id: 'dynamodb', name: 'Amazon DynamoDB', cat: 'datos',
    que: '“Base de datos sin servidor, NoSQL y totalmente administrada con un desempeño de milisegundos de un solo dígito a cualquier escala.”',
    src: 'SV p.13 · BD p.12',
    cuando: [
      'Es la <b>base de datos por defecto en arquitecturas serverless</b> de la clase.',
      'Según la clase de BD: “su servicio es <b>100% server-less</b>. Provee <b>escalabilidad automática</b> y permite <b>transacciones seguras</b>” (BD p.12).',
      'Cuando conviene NoSQL: estructura dinámica, mucho volumen, respuesta rápida, escalar horizontalmente (BD p.15).',
    ],
    ejemplos: ['Items Table de la ToDo App (SV p.15)', 'DynamoDB sentiment table (SV p.16)', 'Datos de tendencias de hashtags (SV p.20)', 'Datos del clima (SV p.21)'],
  },
  { id: 'aurora', name: 'Amazon Aurora Serverless', cat: 'datos',
    que: '“Base de datos relacional compatible con MySQL y PostgreSQL que escala la capacidad de forma automática en función de las necesidades de su aplicación.”',
    src: 'SV p.13',
    cuando: ['Cuando necesitas una base de datos <b>SQL (relacional)</b> dentro de una arquitectura serverless, por ejemplo datos que deben ser consistentes.'],
    ejemplos: ['Solo aparece en la lista de almacenes de datos (SV p.13).'],
  },
  { id: 'rdsproxy', name: 'Amazon RDS Proxy', cat: 'datos',
    que: '“Proxy de base de datos administrada para Amazon Relational Database Service (RDS) que hace las aplicaciones más escalables y seguras.”',
    src: 'SV p.13', cuando: ['Cuando el backend usa una base de datos relacional de RDS.'], ejemplos: ['Lista de almacenes de datos (SV p.13).'],
  },
  { id: 'elasticache', name: 'Amazon ElastiCache sin servidor', cat: 'datos',
    que: '“Facilita la creación de una caché de alta disponibilidad en menos de un minuto y se escala para satisfacer la demanda de las aplicaciones con un rendimiento ultrarrápido.”',
    src: 'SV p.13', cuando: ['Cuando necesitas una <b>caché</b> para responder muy rápido.'], ejemplos: ['Lista de almacenes de datos (SV p.13).'],
  },
  { id: 'opensearch', name: 'Amazon OpenSearch', cat: 'datos',
    que: '“Opción sin servidor de Amazon OpenSearch Service que ayuda a ofrecer análisis de búsquedas y registros sin aprovisionar ni ajustar los recursos.” Es el sucesor de Amazon Elasticsearch Service.',
    src: 'SV p.13, p.18', cuando: ['Para <b>indexar</b> y buscar rápido resultados (metadatos, entidades, etiquetas).'],
    ejemplos: ['Destino de los metadatos en la ingesta de documentos e imágenes (SV p.18)'],
  },
  { id: 'redshift', name: 'Amazon Redshift sin servidor', cat: 'datos',
    que: '“Permite ejecutar y escalar fácilmente los análisis sin necesidad de administrar la infraestructura del almacenamiento de datos y solo pagando por lo que se usa.”',
    src: 'SV p.13', cuando: ['Para <b>análisis</b> de datos.'], ejemplos: ['Lista de almacenes de datos (SV p.13).'],
  },
  { id: 'neptune', name: 'Amazon Neptune sin servidor', cat: 'datos',
    que: '“Base de datos de grafos escalable y bajo demanda que proporciona automáticamente capacidad en función de las necesidades de una aplicación.”',
    src: 'SV p.13', cuando: ['Cuando los datos son un <b>grafo</b>.'], ejemplos: ['Lista de almacenes de datos (SV p.13).'],
  },
  { id: 'cloudwatch', name: 'Amazon CloudWatch', cat: 'monitoreo',
    que: '“Servicio de monitoreo y observabilidad… recopila datos operativos y de monitoreo en forma de registros, métricas y eventos.” Permite establecer alarmas, realizar acciones automatizadas y descubrir información para mantener el buen funcionamiento de sus aplicaciones.',
    src: 'MO p.9',
    cuando: [
      'Para <b>medir</b> el rendimiento (es el paso 1 para optimizar Lambdas, LM p.16).',
      'Para crear <b>alarmas por umbrales</b> y <b>automatizar acciones</b>: emitir una notificación y comenzar el escalado automático (MO p.10, p.12).',
      'Para tener <b>paneles</b> que correlacionan registros y métricas (MO p.11).',
      'Con <b>CloudWatch Events</b> desencadena flujos con Lambda, SNS y CloudFormation (MO p.10).',
    ],
    datos: [
      'Integrado de forma nativa con <b>más de 70 servicios</b> (EC2, DynamoDB, S3, ECS, EKS, Lambda) (MO p.10).',
      'Métricas con pormenorización de <b>1 segundo</b> y hasta <b>15 meses</b> de conservación (MO p.11).',
      '<b>CloudWatch Logs Insights</b>: explorar y analizar registros; pagas solo por las consultas que ejecutas (MO p.11).',
      'Funcionamiento: <b>Collect → Monitor → Act → Analyze</b> (MO p.12).',
    ],
    ejemplos: ['Alarma “DLQ has messages” → email por SNS (SV p.16)', 'CloudWatch Alarms como publicador de SNS (EV p.22)'],
  },
  { id: 'amplify', name: 'AWS Amplify', cat: 'web',
    que: 'En la ToDo App, la “consola de AWS Amplify” sirve para <b>alojar todo el contenido estático</b>. En backends móviles: “Utilice AWS Amplify para integrar fácilmente su backend con sus frontends de iOS, Android, web y React Native.”',
    src: 'SV p.15, p.23',
    cuando: ['Para <b>publicar el frontend</b> (web/móvil) y conectarlo con el backend.'],
    ejemplos: ['Amplify Console conectado a un GitHub Repository (SV p.15)'],
  },
  { id: 'cognito', name: 'Amazon Cognito', cat: 'web', fuera: 'diagrama',
    que: 'Aparece en el diagrama de la ToDo App, entre los <b>dispositivos</b> y la app de un <b>usuario registrado</b>. La diapositiva no lo describe.',
    src: 'SV p.15',
    cuando: ['En la clase se ve solo en la ToDo App (“permite a un usuario registrado…”). <span class="tag warn">fuera de las diapositivas</span> De forma general, Cognito es el servicio de AWS para registro e inicio de sesión de usuarios.'],
    ejemplos: ['ToDo App (SV p.15)'],
  },
  { id: 'route53', name: 'Amazon Route 53', cat: 'web', fuera: 'diagrama',
    que: 'Aparece en el diagrama de la ToDo App conectado a los dispositivos. La diapositiva no lo describe.',
    src: 'SV p.15',
    cuando: ['<span class="tag warn">fuera de las diapositivas</span> De forma general, Route 53 es el servicio DNS de AWS (resuelve el dominio de la web).'],
    ejemplos: ['ToDo App (SV p.15)'],
  },
  { id: 'rekognition', name: 'Amazon Rekognition', cat: 'ml',
    que: 'Servicio de <b>machine learning</b> de Amazon para “descubrir información en los datos no estructurados”. En el diagrama recibe una <b>imagen</b> (JPG) y devuelve <b>etiquetas (labels)</b>.',
    src: 'SV p.18',
    cuando: ['Cuando hay que <b>analizar imágenes</b> automáticamente.'],
    ejemplos: ['Extract Text (JPG) → Rekognition → Labels (SV p.18)'],
  },
  { id: 'comprehend', name: 'Amazon Comprehend', cat: 'ml',
    que: 'Servicio de <b>machine learning</b> de Amazon. En los diagramas recibe <b>texto</b> y devuelve <b>entidades</b> o el <b>sentimiento</b>.',
    src: 'SV p.16, p.18',
    cuando: ['Cuando hay que <b>analizar texto</b> (sentimiento, entidades).'],
    ejemplos: ['Comprehend Sentiment Analysis (SV p.16)', 'Analyze → Comprehend → Entities (SV p.18)'],
  },
];

const SVC = Object.fromEntries(SERVICES.map(s => [s.id, s]));

/* ───────────── LECCIONES ─────────────
   {{dia:ID}} se reemplaza por el diagrama DIAGRAMS[ID]; {{lambda-timeline}} por el gráfico de concurrencia */
const LESSONS = [
{ id: 'serverless', deck: 'SV', title: 'Arquitectura sin servidor (serverless)', short: 'Qué es serverless y FaaS, cuándo usarlo, los servicios de AWS por capa y los 9 ejemplos de clase.',
  html: `
<h2>1. Desde cero: ¿qué es serverless?</h2>
<p>En palabras simples: <b>tú escribes el código y el proveedor se encarga de los servidores</b>. No compras, configuras ni parchas máquinas.</p>
<div class="quote">“Cree y ejecute aplicaciones sin preocuparse por los servidores.” “Son tecnologías para ejecutar código, administrar datos e integrar aplicaciones, todo sin tener que administrar servidores. Las tecnologías sin servidor incluyen <b>escalado automático</b>, <b>alta disponibilidad integrada</b> y un <b>modelo de facturación de pago por uso</b>… Estas tecnologías también eliminan las tareas de administración de infraestructura, como el aprovisionamiento de capacidad y la aplicación de parches, de manera que pueda enfocarse en escribir el código que sirva a sus clientes.”</div>
<div class="src">SV p.6 (fuente: aws.amazon.com/es/serverless)</div>

<h3>El flujo serverless en 4 pasos (infografía de clase)</h3>
<ol class="steps">
  <li><b>Evento / solicitud</b>: llega desde la web/API, una app móvil, dispositivos IoT o una tarea programada.</li>
  <li><b>Función (tu código)</b>: escribes funciones que se ejecutan <b>solo cuando ocurre un evento</b>.</li>
  <li><b>Plataforma serverless (del proveedor)</b>: <b>ejecución bajo demanda</b> (la función se ejecuta solo cuando es invocada), <b>escalado automático</b> según la demanda, <b>gestión de infraestructura</b> (servidores, SO, redes) y <b>alta disponibilidad</b> (tolerante a fallos). Proveedores: AWS, Azure, Google Cloud y otros.</li>
  <li><b>Resultado</b>: tu aplicación responde y <b>pagas solo por lo que usas</b>.</li>
</ol>
<div class="tablewrap"><table>
<tr><th>Tradicional (con servidores)</th><th>Serverless</th></tr>
<tr><td>Aprovisionar servidores → configurar y mantener → escalar manualmente → pagar por capacidad (muchas veces ociosa)</td><td>Escribes tu código → se ejecuta bajo demanda → escalado automático → pagas solo por uso real</td></tr>
</table></div>
<p><b>Ideal para:</b> APIs, backends móviles, procesamiento de imágenes, bots, tareas programadas, análisis de datos y más.</p>
<div class="src">SV p.5 (infografía “¿Qué es serverless?”)</div>

<h3>¿Qué es FaaS (función como servicio)?</h3>
<div class="quote">“La función como servicio (FaaS) es un tipo de servicio de cloud computing que permite que los desarrolladores diseñen, ejecuten y gestionen paquetes de aplicaciones como funciones sin tener que ocuparse del mantenimiento de su propia infraestructura. Es un modelo de ejecución que <b>se basa en los eventos</b> y se ejecuta en <b>contenedores sin estado</b>.”</div>
<div class="src">SV p.7 (fuente: Red Hat)</div>
<p>En AWS, el servicio FaaS es <b>AWS Lambda</b>.</p>

<h2>2. ¿Cuándo utilizarla?</h2>
<div class="two">
 <div class="card"><b>Pase de la idea al mercado, más rápido</b><br>Elimina tareas operativas para <b>efectuar lanzamientos rápidamente</b>, obtener retroalimentación e iterar.</div>
 <div class="card"><b>Disminuya sus costos</b><br>Facturación de pago por valor: <b>nunca deberá pagar por exceso de aprovisionamiento</b>.</div>
 <div class="card"><b>Adapte a escala</b><br>Tecnologías que <b>se escalan automáticamente</b> de cero a las demandas máximas.</div>
 <div class="card"><b>Cree mejores aplicaciones, con más facilidad</b><br>Integraciones de servicios ya incluidas: <b>puede centrarse en construir su aplicación en lugar de configurarla</b>.</div>
</div>
<div class="src">SV p.9</div>

<h2>3. ¿Cómo implementarla en AWS? Las 3 capas</h2>
<p>“AWS ha desarrollado servicios sin servidor para las <b>tres capas</b> del conjunto: <b>cómputo</b> (informática), <b>integración</b> y <b>almacenamiento de datos</b>.”</p>
<div class="tablewrap"><table>
<tr><th>Capa</th><th>Servicios (los resaltados en clase en negrita)</th></tr>
<tr><td><span class="cat" style="background:var(--c-computo)"></span>Cómputo</td><td><b>AWS Lambda</b>, AWS Fargate</td></tr>
<tr><td><span class="cat" style="background:var(--c-integracion)"></span>Integración de la aplicación</td><td>Amazon EventBridge, AWS Step Functions, <b>Amazon SQS</b>, <b>Amazon SNS</b>, <b>Amazon API Gateway</b>, AWS AppSync</td></tr>
<tr><td><span class="cat" style="background:var(--c-datos)"></span>Almacén de datos</td><td><b>Amazon S3</b>, Amazon EFS, <b>Amazon DynamoDB</b>, Amazon RDS Proxy, Amazon Aurora Serverless, Amazon Redshift sin servidor, Amazon Neptune sin servidor, Amazon OpenSearch sin servidor, Amazon ElastiCache sin servidor</td></tr>
</table></div>
<div class="src">SV p.11–13</div>
<p>Puedes ver qué hace cada uno en la pestaña <a href="#/servicios">Servicios</a>.</p>

<h2>4. Ejemplos de clase (son los modelos a imitar en el examen)</h2>
<h3>a) Aplicaciones web: ToDo App</h3>
<p>App “de cosas para hacer” donde un usuario registrado crea, actualiza, visualiza y elimina elementos. <b>Lambda + API Gateway</b> para la lógica de negocio, <b>DynamoDB</b> como base de datos y la consola de <b>Amplify</b> para alojar el contenido estático.</p>
{{dia:todo}}
<div class="src">SV p.15</div>

<h3>b) Procesamiento de datos: notas en Markdown</h3>
<p>Se entregan notas de una entrevista en Markdown a <b>S3</b>. Los <b>eventos de S3</b> desencadenan varios flujos: uno <b>convierte Markdown a HTML</b> y otro <b>detecta el sentimiento</b>. Si una Lambda falla, el mensaje va a una <b>Dead Letter Queue</b>, una <b>alarma de CloudWatch</b> lo detecta y <b>SNS</b> envía un email.</p>
{{dia:markdown}}
<div class="src">SV p.16 · la misma cadena DLQ → alarma → email existe también en la rama de conversión</div>

<h3>c) Procesamiento por lotes: calidad del aire (ETL)</h3>
<p>Una <b>regla de EventBridge</b> programa el flujo de forma recurrente. <b>Step Functions</b> orquesta Lambdas que calculan las mediciones mínimas, máximas y promedio de la calidad del aire (extracción, transferencia y carga).</p>
{{dia:batch}}
<div class="src">SV p.17</div>

<h3>d) Ingesta de eventos: indexar documentos e imágenes</h3>
<p>Servicios de ML (<b>Comprehend</b> y <b>Rekognition</b>) descubren información en datos no estructurados y envían los resultados a <b>OpenSearch</b> para indexarlos rápido. Funciona bien en comercio electrónico (p. ej. análisis de secuencias de clics).</p>
{{dia:ingesta}}
<div class="src">SV p.18</div>

<h3>e) Los 5 ejemplos de la página de Lambda</h3>
<p><b>Procesamiento de archivos</b>: S3 desencadena a Lambda en tiempo real después de una carga (o se conecta a EFS para acceso compartido masivamente paralelo).</p>
{{dia:resize}}
<p><b>Procesamiento de transmisiones</b>: Lambda + Kinesis para streaming en tiempo real (actividad de apps, pedidos, clics, limpieza de datos, logs, indexación, redes sociales, <b>telemetría IoT</b> y medición).</p>
{{dia:hashtags}}
<p><b>Aplicaciones web</b>: Lambda con otros servicios para webs que se escalan automáticamente y se ejecutan con alta disponibilidad en varios centros de datos.</p>
{{dia:weather}}
<p><b>Backends para IoT</b>: Lambda para administrar solicitudes web, móviles, IoT y de API de terceros.</p>
{{dia:tractor}}
<p><b>Backends móviles</b>: Lambda + API Gateway para autenticar y procesar solicitudes; Amplify para integrar con frontends iOS, Android, web y React Native.</p>
{{dia:status}}
<div class="src">SV p.19–23</div>

<h2>5. Preguntas de cierre del profesor</h2>
<ul><li>¿Qué es una arquitectura serverless?</li><li>¿Cuándo es conveniente usar arquitectura serverless?</li><li>¿Qué servicios de AWS se pueden usar para arquitectura serverless?</li></ul>
<p>Practícalas con respuesta modelo en <a href="#/practica">Práctica → Preguntas abiertas</a>.</p>
`},

{ id: 'lambdas', deck: 'LM', title: 'Optimización de Lambdas', short: 'Memoria y CPU, el límite de 15 minutos, cold start, concurrencia y 6 formas de optimizar.',
  html: `
<h2>1. Memoria RAM y CPU</h2>
<ul>
 <li>La memoria de la función se asigna <b>de 128 MB a 10 240 MB</b>, en incrementos de 1 MB.</li>
 <li><b>Lambda asigna potencia de CPU en proporción a la cantidad de memoria configurada.</b> Para subir o bajar CPU se cambia la configuración <i>Memoria (MB)</i>.</li>
 <li><b>En 1769 MB, la función tiene el equivalente de una vCPU.</b></li>
 <li>Con el máximo de 10 240 MB (10 GB) se accede a <b>hasta 6 vCPU</b>. Esto ayuda a que apps de uso intensivo (machine learning, generación de modelos, genómica, HPC) se ejecuten más rápido.</li>
</ul>
<div class="src">LM p.5–6</div>
<div class="note">👉 Idea clave para el examen: en Lambda <b>no eliges la CPU directamente</b>. Si quieres más CPU, <b>subes la memoria</b>.</div>

<h2>2. Tiempo de ejecución máximo</h2>
<p>Tiempo de espera de la función: <b>900 segundos (15 minutos)</b>.</p>
<div class="src">LM p.8</div>
<div class="note">👉 Si un proceso dura más de 15 minutos, no cabe en una sola Lambda. En clase, el ETL por lotes se divide en varios pasos orquestados con Step Functions (SV p.17).</div>

<h2>3. Cold Start (arranque en frío)</h2>
<div class="quote">“En Lambda estas funciones corren en un <b>contenedor</b>. Si tu función está corriendo, el contenedor está activo y preparado para recibir nuevas ejecuciones (función activa). Si nadie llama a tu función, después de un tiempo de inactividad (<b>~10 min</b>) el contenedor se va a enfriar (cold) y tu función pasará a ser inactiva; el proveedor eliminará ese contenedor. Cuando alguien llama a una función inactiva, el proveedor tendrá que provisionar una máquina, crear el contenedor y ejecutar tu código. Esto trae latencia: en los peores casos tu función puede tardar <b>hasta 5 segundos</b> en responder.”</div>
<p><b>Definición:</b> cold start es <b>el delay que se produce cuando se llama a una función inactiva</b>. Cuando la función está caliente (warm) no hay delay, porque AWS reutiliza el mismo contenedor.</p>
<p><b>Qué lo empeora:</b> el <b>peso de tu código (dependencias incluidas)</b>. Cuanto más pesa, más le cuesta a AWS copiarlo al nuevo contenedor y correrlo.</p>
<div class="src">LM p.10</div>

<h3>Fases de una ejecución (“Decomposing a Function Execution”)</h3>
<div class="tablewrap"><table>
<tr><th>1. Code Download</th><th>2. Start Execution Environment</th><th>3. Execute Init Code</th><th>4. Execute Handler Code</th></tr>
<tr><td colspan="2" style="text-align:center"><b>Full Cold Start</b></td><td style="text-align:center"><b>Partial Cold Start</b></td><td style="text-align:center"><b>Warm Start</b></td></tr>
</table></div>
<p>En el código de ejemplo, el <b>init code</b> es lo que está fuera del handler (importar librerías, leer variables de entorno) y el <b>handler</b> es <code>exports.handler = async (event) =&gt; {…}</code>.</p>
<div class="src">LM p.15</div>

<h2>4. Concurrencia</h2>
<div class="quote">“Concurrency is the number of in-flight requests that your AWS Lambda function is handling at the same time. For each concurrent request, Lambda provisions a <b>separate instance of your execution environment</b>. As your functions receive more requests, Lambda automatically handles scaling the number of execution environments until you reach your account's concurrency limit. By default, Lambda provides your account with a total concurrency limit of <b>1,000 concurrent executions across all functions in an AWS Region</b>.”</div>
<p>En español: la concurrencia es <b>cuántas solicitudes atiende la función al mismo tiempo</b>. Cada solicitud simultánea recibe <b>su propio entorno de ejecución</b>. El límite por defecto es <b>1000</b>, compartido por todas las funciones de la región.</p>
<div class="src">LM p.12</div>
<h3>Ejemplo de clase: 10 solicitudes</h3>
{{lambda-timeline}}
<ul>
 <li>Las solicitudes 1 a 5 llegan mientras los entornos anteriores están ocupados, así que cada una crea un entorno nuevo (A–E) con su fase <b>Init</b>.</li>
 <li>Las solicitudes 6, 7, 8 y 10 <b>reutilizan</b> entornos que ya terminaron (A, B, C, D): <b>no hay Init</b>, son warm starts.</li>
 <li>La solicitud 9 llega cuando todos los entornos están ocupados, así que se crea uno nuevo (F) con Init.</li>
 <li>Resultado: <b>10 solicitudes, 6 entornos de ejecución, 6 cold starts</b>.</li>
</ul>
<div class="src">LM p.13 (lectura del gráfico)</div>

<h2>5. Optimización del tiempo de ejecución (6 formas)</h2>
<ol class="steps">
 <li><b>Measure current performance (CloudWatch)</b>: primero medir.</li>
 <li><b>Keep your functions warm</b>: hacerle ping cada n minutos para que no se enfríe.</li>
 <li><b>Choose the right memory settings</b>: más memoria también da más CPU.</li>
 <li><b>Store dependencies external to your function (Lambda Layers)</b>: el código pesa menos.</li>
 <li><b>Keep your function small and single-purpose</b>: funciones pequeñas y de un solo propósito.</li>
 <li><b>Simultaneidad aprovisionada</b>: reduce el cold start.</li>
</ol>
<div class="tablewrap"><table>
<tr><th>Simultaneidad reservada</th><th>Simultaneidad aprovisionada</th></tr>
<tr><td>Es la <b>cantidad máxima de instancias simultáneas</b> asignadas a la función. Cuando una función la tiene reservada, <b>ninguna otra función puede usarla</b>. Sirve para garantizar que las funciones más importantes siempre tengan simultaneidad suficiente. <b>No tiene cargo adicional.</b></td>
<td>Es la <b>cantidad de entornos de ejecución preinicializados</b> asignados a la función, <b>listos para responder de forma inmediata</b>. Sirve para <b>reducir las latencias de arranque en frío</b>. <b>Genera cargos adicionales.</b></td></tr>
</table></div>
<div class="src">LM p.16</div>

<h2>6. Preguntas de cierre del profesor</h2>
<ul><li>¿Cómo se maneja la memoria RAM y CPU del Lambda?</li><li>¿Cuál es el tiempo de ejecución máximo de Lambda?</li><li>Explique qué es el Cold Start del Lambda.</li><li>Explique cómo es la concurrencia de ejecución de lambdas.</li><li>¿Cómo se puede optimizar o mejorar el tiempo de ejecución del Lambda?</li></ul>
`},

{ id: 'eventos', deck: 'EV', title: 'Arquitectura basada en eventos', short: 'Productores, enrutadores y consumidores; síncrono vs asíncrono; pub/sub y fan out; EventBridge vs SNS.',
  html: `
<h2>1. Desde cero: ¿qué es un evento?</h2>
<p>Un <b>evento</b> es <b>un cambio de estado o una actualización</b>, por ejemplo un elemento que se coloca en el carrito de una tienda online. Puede <b>llevar el estado</b> (el producto, su precio y la dirección) o ser <b>solo un identificador</b> (una notificación de que se envió una orden).</p>
<div class="quote">“La arquitectura basada en eventos utiliza eventos para desencadenar y establecer comunicación entre <b>servicios desacoplados</b>, y es común en las aplicaciones modernas creadas con microservicios.” En resumen: “<b>Sistemas desacoplados que se ejecutan en respuesta a eventos</b>”.</div>
<div class="src">EV p.5</div>

<h2>2. Los 3 componentes</h2>
<ol class="steps">
 <li><b>Productor de eventos</b>: publica el evento.</li>
 <li><b>Enrutador de eventos</b> (router, bus o broker): recibe, <b>filtra</b> y envía los eventos a los consumidores adecuados.</li>
 <li><b>Consumidores de eventos</b>: reaccionan al evento.</li>
</ol>
<p>Como productores y consumidores están <b>desacoplados</b>, pueden <b>escalarse, actualizarse e implementarse de manera independiente</b>.</p>
<div class="src">EV p.6</div>

<h3>Ejemplo AWS: comercio electrónico</h3>
<p>Permite que el sitio reaccione a cambios de diversas fuentes en los momentos de mayor demanda, <b>sin que se bloquee la aplicación ni se sobreaprovisionen recursos</b>.</p>
{{dia:ecommerce}}
<div class="src">EV p.7</div>

<h3>Ejemplo de la infografía: tienda online</h3>
<p>Los componentes <b>no se llaman directamente entre sí</b>: se comunican publicando eventos que otros consumen si les interesan. <b>El productor no necesita saber quién consume el evento, y los consumidores tampoco necesitan conocer al productor.</b></p>
{{dia:pedido}}
<p>1) El cliente hace un pedido. 2) El Servicio de Pedidos publica <code>PedidoCreado { pedidoId: 1234, clienteId: 567, total: 89.90 }</code>. 3) El bus lo entrega a todos los servicios interesados. 4) Cada uno lo procesa de forma independiente: Inventario descuenta el stock, Notificaciones envía el email y Analítica guarda la venta.</p>
<div class="tablewrap"><table><tr><th>Beneficio</th><th>Qué significa</th></tr>
<tr><td>Desacoplamiento</td><td>Los componentes no dependen unos de otros.</td></tr>
<tr><td>Escalabilidad</td><td>Cada servicio escala de forma independiente.</td></tr>
<tr><td>Resiliencia</td><td>Si un servicio está caído, los eventos no se pierden.</td></tr>
<tr><td>Fácil de extender</td><td>Los nuevos servicios pueden suscribirse sin cambiar el productor.</td></tr></table></div>
<div class="src">EV p.8</div>

<h2>3. ¿Cuándo utilizarla?</h2>
<ul>
 <li><b>Supervisión del estado de los recursos y alertas</b></li>
 <li><b>Procesamiento en paralelo y distribución ramificada</b> (fan out)</li>
 <li><b>Integración de sistemas heterogéneos</b></li>
 <li><b>Replicación de datos entre cuentas y regiones</b></li>
</ul>
<div class="src">EV p.10</div>

<h2>4. ¿Cómo implementarla en AWS? EventBridge vs SNS</h2>
<p>Hay dos tipos principales de enrutadores: <b>buses de eventos</b> y <b>temas de eventos</b>. En AWS, <b>EventBridge</b> sirve para crear buses de eventos y <b>SNS</b> para crear temas.</p>
<div class="tablewrap"><table>
<tr><th>Amazon EventBridge (bus) <small>lanzado en julio 2019</small></th><th>Amazon SNS (tema)</th></tr>
<tr><td>Se recomienda cuando quiere crear una aplicación que reaccione a los eventos de <b>aplicaciones SaaS, servicios de AWS o aplicaciones personalizadas</b>.<br>Usa un <b>esquema predefinido</b> para los eventos y permite crear <b>reglas que se aplican a todo el cuerpo del evento para filtrarlo</b> antes de enviarlo a los consumidores.</td>
<td>Se recomienda para una app que reaccione a eventos de <b>alto rendimiento y baja latencia</b> publicados por otras aplicaciones, microservicios o servicios de AWS, o para apps que necesitan una <b>gran difusión (miles o millones de puntos de conexión)</b>.<br>Los temas de SNS son <b>independientes del esquema</b> de los eventos que se publiquen.</td></tr>
</table></div>
<div class="src">EV p.12</div>
<div class="note">👉 Regla rápida: si necesitas <b>filtrar o rutear según el contenido</b> del evento, usa <b>EventBridge</b>. Si necesitas <b>difundir a muchísimos destinos</b> (incluidas personas por email/SMS), usa <b>SNS</b>.</div>

<h2>5. Patrones de diseño</h2>
<h3>Monolito vs microservicios</h3>
<p><b>Monolith: does everything</b> (hace todo). <b>Microservices: does one thing</b> (cada uno hace una sola cosa).</p>
<div class="src">EV p.14</div>
<h3>Dos patrones de comunicación entre microservicios</h3>
<div class="two">
<div><b>1) Síncrona</b> (application to application)
{{dia:sync}}</div>
<div><b>2) Asíncrona / basada en eventos</b> (application to queue to application)
{{dia:async}}</div>
</div>
<div class="src">EV p.15</div>
<h3>Síncrono = acoplado</h3>
<p>El cliente hace <code>POST /order</code> al Order service, que a su vez hace <code>POST /invoice</code> al Invoice service. Cada uno espera el <code>201</code> del siguiente: <b>Synchronous, Coupled</b>.</p>
{{dia:syncchain}}
<p>En la <b>Architecture v2</b> el Order service llama directamente a Invoice, Fulfillment y Forecasting: sigue siendo <b>síncrono y acoplado</b>. Cada nuevo servicio obliga a cambiar el Order service.</p>
{{dia:v2}}
<div class="src">EV p.16–17</div>
<h3>Fan Out (abanico) con EventBridge = asíncrono y desacoplado</h3>
<p>El Order service publica una sola vez en EventBridge y las <b>reglas de ruteo/filtrado</b> deciden a qué servicios llega: <b>Asynchronous, Decoupled</b>.</p>
{{dia:fanout}}
<div class="src">EV p.18–19</div>
<h3>Pub/Sub con SNS: “¿qué pasa si quieres enviar un mensaje a muchos receptores?”</h3>
<div class="two"><div><b>Integración directa</b>: el Buying Service llama a cada destino.{{dia:direct}}</div>
<div><b>Pub / Sub</b>: el Buying Service publica en un <b>SNS Topic</b> y los suscriptores lo reciben.{{dia:pubsub}}</div></div>
<div class="src">EV p.20</div>
<h3>SNS + SQS: Fan Out</h3>
<p>Un tema SNS reparte el mensaje a <b>una cola SQS por cada servicio</b>, y cada servicio consume su cola a su ritmo.</p>
{{dia:snssqs}}
<div class="src">EV p.21</div>
<h3>Quién publica en SNS y quién se suscribe</h3>
<div class="tablewrap"><table><tr><th>Publicadores (publish →)</th><th>Suscriptores (→ publish)</th></tr>
<tr><td>CloudWatch Alarms, AWS Budgets, Lambda, Auto Scaling Group (notificaciones), S3 Bucket (eventos), DynamoDB, CloudFormation (cambios de estado), AWS DMS (nueva réplica), RDS Events…</td><td>SQS, Lambda, Kinesis Data Firehose, Emails, SMS y notificaciones móviles, endpoints HTTP(S)</td></tr></table></div>
<div class="src">EV p.22</div>

<h2>6. Preguntas de cierre del profesor</h2>
<ul><li>¿Qué es una arquitectura basada en eventos?</li><li>¿Cuándo es conveniente usar arquitectura basada en eventos?</li><li>Explique el patrón de diseño pub/sub - fan out.</li><li>¿Qué servicios de AWS se pueden usar para arquitectura basada en eventos?</li></ul>
`},

{ id: 'multitenancy', deck: 'MT', title: 'Multi-tenancy (tenencia múltiple)', short: 'Qué es, single tenant vs multi tenant y los 3 patrones de base de datos.',
  html: `
<h2>1. Desde cero</h2>
<p>Un <b>tenant</b> (inquilino) es un <b>cliente</b>: una empresa, una universidad o una sede. Multi-tenancy significa que <b>muchos clientes usan la misma aplicación y la misma infraestructura</b>, pero cada uno ve <b>solo sus datos</b>.</p>
<div class="quote">“En la informática en la nube, la tenencia múltiple significa que <b>varios clientes de un proveedor de la nube utilizan los mismos recursos informáticos</b>. A pesar de que comparten recursos, los clientes <b>no saben de la existencia de otros clientes</b>, y sus datos se mantienen <b>totalmente separados</b>. La arquitectura de tenencia múltiple es una característica de muchos tipos de informática en nube pública, como <b>IaaS, PaaS, SaaS, contenedores e informática sin servidor</b>.”</div>
<div class="src">MT p.7 (Cloudflare / Datamation)</div>
<div class="quote">“Multi-Tenancy es un <b>principio de arquitectura de software</b> donde una aplicación puede albergar a múltiples clientes; todos trabajan sobre <b>la misma instancia de software</b> que se ejecuta en el mismo servidor, con la única diferencia de que <b>los datos que puede ver cada cliente son diferentes</b>, logrando que la aplicación se vea como si fuera construida exclusivamente para uno de ellos.”</div>
<div class="src">MT p.8 (Oscar Blancarte)</div>

<h3>Ejercicio de análisis de la clase</h3>
<p>Para <b>Office 365, G Suite, Netflix y Zoom</b>, y luego para el <b>Sistema Académico de UTEC</b> (core.utec.edu.pe) y <b>Canvas</b> (utec.instructure.com), la clase pregunta:</p>
<ul><li>¿Qué modelo de servicio son? (On-Premises / IaaS / PaaS / SaaS)</li><li>¿Qué modelo de despliegue son? (pública / privada / híbrida)</li><li>¿Cuántos clientes tienen? ¿Sirven para otras universidades?</li><li>¿Qué hardware, bases de datos y software creen que usan?</li></ul>
<div class="src">MT p.5–6</div>
<div class="note"><span class="tag warn">interpretación, la diapositiva solo hace las preguntas</span> Office 365, G Suite, Netflix y Zoom son <b>SaaS en nube pública</b> con millones de clientes que comparten la misma aplicación, es decir, <b>multi-tenant</b>. El Sistema Académico de UTEC (“Copyright © 2014 UTEC”) es una aplicación propia de la universidad. Canvas se accede como <code>utec.instructure.com</code>, un subdominio de un proveedor que sirve a varias universidades: cada universidad es un tenant.</div>

<h2>2. Single tenant vs Multi tenant</h2>
<div class="tablewrap"><table>
<tr><th>Single tenant</th><th>Multi tenant</th></tr>
<tr><td>Opción “deluxe”: el cliente opera en un <b>entorno exclusivamente dedicado</b> (SW, HW y base de datos).</td><td>Cada cliente <b>comparte la misma aplicación</b> de software, el hardware y eventualmente la base de datos (*).</td></tr>
<tr><td>Puede <b>modificar el software</b> a su medida.</td><td><b>La misma aplicación</b> de software para todos los clientes.</td></tr>
<tr><td></td><td>Podría <b>afectarse el rendimiento</b> por el uso intensivo de la aplicación por otros clientes.</td></tr>
<tr><td><b>Mayor costo</b> de infraestructura.</td><td><b>Menor costo</b> de infraestructura porque es compartida.</td></tr>
<tr><td><b>Mayor seguridad</b> de los datos.</td><td><b>Menor seguridad</b> de los datos.</td></tr>
</table></div>
<p>(*) Depende del patrón de diseño de la base de datos.</p>
<div class="src">MT p.10</div>

<h2>3. Patrones de diseño de BD multi-tenancy</h2>
<h3>Patrón 1: A Single, Shared Database Schema</h3>
<p>Un <b>esquema único y compartido</b>. Las tablas deben tener un campo <code>TENANT_ID</code> para identificar sus registros:</p>
<p><code>SELECT * FROM ORDERS WHERE TENANT_ID = ?</code></p>
{{dia:mt1}}
<div class="src">MT p.12</div>
<h3>Patrón 2: Single Database, Multiple Schemas</h3>
<p>Cada <b>schema</b> pertenece a un tenant (cliente o empresa) y tiene una <b>réplica de las tablas</b>. Ya no se segmenta con el WHERE; el reto es <b>conectarse al schema correcto según el cliente</b> que hace la solicitud.</p>
{{dia:mt2}}
<div class="src">MT p.13</div>
<h3>Patrón 3: Multiple Databases</h3>
<p>Es la estrategia con el <b>mayor nivel de aislamiento y seguridad</b>, porque cada cliente tiene <b>su propia base de datos</b>. Pero implica el <b>mayor esfuerzo de configuración</b>: hay que crear una nueva base de datos por cada cliente que se registra.</p>
{{dia:mt3}}
<div class="src">MT p.14</div>
<div class="tablewrap"><table><tr><th></th><th>Patrón 1</th><th>Patrón 2</th><th>Patrón 3</th></tr>
<tr><td>Cómo se separa</td><td>Columna TENANT_ID + WHERE</td><td>Un schema por tenant</td><td>Una BD por tenant</td></tr>
<tr><td>Aislamiento / seguridad</td><td>Menor</td><td>Intermedio</td><td><b>Mayor</b></td></tr>
<tr><td>Esfuerzo de configuración</td><td>Menor</td><td>Intermedio (conectar al schema correcto)</td><td><b>Mayor</b> (nueva BD por cliente)</td></tr></table></div>
<div class="note design"><span class="tag design">resumen propio</span> La fila “Intermedio” del patrón 2 es una comparación nuestra entre los otros dos. La diapositiva solo dice explícitamente que el patrón 3 es el de mayor aislamiento y el de mayor esfuerzo.</div>

<h2>4. Preguntas de cierre del profesor</h2>
<ul><li>¿Qué es Multi-tenancy o tenencia múltiple?</li><li>Explique una diferencia entre Single tenant vs Multi tenant.</li><li>Explique un patrón de diseño para bases de datos Multi-tenancy.</li></ul>
`},

{ id: 'bd', deck: 'BD', title: 'Bases de Datos: SQL vs NoSQL', short: 'Qué es una base de datos, SQL vs NoSQL, sus motores y en qué casos usar cada una.',
  html: `
<h2>1. Desde cero: ¿qué es una base de datos?</h2>
<ol class="steps">
 <li>Un <b>conjunto organizado de información sobre un tema</b>. Ej.: la lista de estudiantes de un curso y sus calificaciones.</li>
 <li>Que se <b>almacena usando un sistema</b>. Ej.: tablas para guardar los nombres de los estudiantes y sus calificaciones.</li>
 <li>Que <b>permite consultarla cuando se necesite</b>. Ej.: “necesito la lista de los mejores estudiantes”.</li>
</ol>
<p><b>Motor de base de datos</b> = el <b>software</b> para organizar y consultar la información. <b>La base de datos es solo la información.</b> La persona que diseña y administra bases de datos es el <b>DBA</b> (Data Base Administrator).</p>
<div class="src">BD p.5</div>

<h2>2. SQL (relacionales)</h2>
<p>Organizan la información en <b>tablas</b> y <b>evitan que los datos se repitan</b>. Motores: MySQL, Postgres, SQL Server, Oracle.</p>
<div class="tablewrap"><table><tr><th>Motor</th><th>Lo que dice la clase</th></tr>
<tr><td>Oracle</td><td>El motor relacional comercial <b>más antiguo</b>. Su creador, Larry Ellison, estuvo en el comité que definió SQL.</td></tr>
<tr><td>Microsoft SQL Server</td><td>Multiplataforma desde 2017. Son <b>líderes en Business Intelligence</b>.</td></tr>
<tr><td>MySQL</td><td>El <b>motor más usado en la web</b> (preferido por los CMS clásicos en PHP como WordPress, Drupal y Magento).</td></tr>
<tr><td>SQLite</td><td>Base de datos <b>embebida en el programa</b>. Como está integrada en todos los teléfonos, se usa para el almacenamiento interno de apps.</td></tr>
<tr><td>MariaDB</td><td><b>Fork de MySQL</b> creado a partir de su compra por Oracle. Es compatible con MySQL.</td></tr>
<tr><td>PostgreSQL</td><td>Empezó como un proyecto universitario (INGRES) inspirado en Oracle. Usa <b>funciones y triggers</b> que MySQL no tuvo durante años.</td></tr></table></div>
<div class="src">BD p.8</div>
<h3>¿Cómo diseñar una base de datos relacional?</h3>
<ol class="steps"><li><b>Levanta requerimientos</b>, y si es posible ten los wireframes y prototipos listos.</li><li><b>Diseño conceptual</b>: dibuja entidades y sus relaciones (no comiences con código).</li><li><b>Diseño lógico</b>: tabula el diseño conceptual y <b>normaliza</b> la base de datos; el motor no importa.</li><li><b>Diseño físico</b>: tipos de datos, dominios, índices. Aquí escribes SQL (<code>CREATE TABLE …</code>).</li></ol>
<div class="src">BD p.9</div>

<h2>3. NoSQL (no relacionales)</h2>
<p><b>No usan tablas</b>, y los datos <b>pueden repetirse en diferentes lugares para acceder más rápido</b>. Son BD que <b>priorizan el acceso rápido a la información sobre la integridad de los datos</b>. Motores: Cassandra, MongoDB, Firebase, Redis.</p>
<div class="tablewrap"><table><tr><th>Motor</th><th>Lo que dice la clase</th></tr>
<tr><td>MongoDB</td><td><b>Orientada a documentos</b>. Guarda los datos en <b>BSON</b>, una representación binaria de JSON (lo usan Trello, Lyft y Uber).</td></tr>
<tr><td>Azure Cosmos DB</td><td>Multi-modelo, de distribución global y escalado horizontal. Desarrollada por Microsoft.</td></tr>
<tr><td>ArangoDB</td><td>Usa su lenguaje AQL, que permite estructuras de tipo <b>clave/valor, relacionales y grafos</b>.</td></tr>
<tr><td>Google Cloud Firestore</td><td>De uso en la nube. Permite <b>transacciones ACID</b> y tiene soporte sin conexión.</td></tr>
<tr><td><b>Amazon DynamoDB</b></td><td>Servicio <b>100% server-less</b>, con <b>escalabilidad automática</b> y transacciones seguras (Netflix, Mercado Libre).</td></tr>
<tr><td>Redis</td><td>Es popular por su <b>almacenamiento de datos en memoria RAM</b> (Airbnb, Instagram, Slack).</td></tr></table></div>
<div class="src">BD p.12</div>
<p>Tipos de almacenamiento NoSQL que muestra la clase: <b>Key/value store</b>, <b>Document database</b> y <b>Column family store</b> (BD p.16). Ejemplo de documento: un JSON <code>{"ID":1,"FIRST":"Frank","LAST":"Weigel","ZIP":"94040","CITY":"MV","STATE":"CA"}</code> equivale a juntar las tablas <i>User Info</i> y <i>Address Info</i> (BD p.13).</p>

<h2>4. SQL vs NoSQL</h2>
<div class="tablewrap"><table>
<tr><th>SQL (relacional)</th><th>NoSQL (no relacional)</th></tr>
<tr><td>Basada en <b>tablas</b></td><td>Basada en <b>documentos</b></td></tr>
<tr><td>Mantiene una <b>estructura definida</b> previamente en el diseño (estructura estricta)</td><td>Su estructura puede ser <b>dinámica</b></td></tr>
<tr><td>Diseñada para tener la <b>menor redundancia</b> posible (evita duplicar información)</td><td><b>Permite redundancia</b> de datos para <b>agilizar las consultas</b></td></tr>
<tr><td>Para apps que requieren <b>datos consistentes</b> sin posibilidad de error (ej. <b>datos financieros</b>). Por su estructura, la actualización de la información <b>es más segura</b>. Se usa en el sector <b>empresarial y financiero</b>.</td><td>Para apps que requieren <b>grandes cantidades de datos</b> a consultar. <b>Prioriza velocidad sobre integridad.</b> Para apps que necesitan <b>reducir su tiempo de respuesta</b>, como <b>redes sociales</b>.</td></tr>
<tr><td><b>Escalable verticalmente</b>: aumentar las prestaciones del servidor</td><td><b>Escalable horizontalmente</b>: agregar más servidores</td></tr>
<tr><td>Casos: Web, Mobile, Enterprise, Data mart. “Relationships use joins”.</td><td>Casos: Gaming, Social, <b>IoT</b>, Web, Mobile, Enterprise</td></tr>
</table></div>
<div class="src">BD p.15–16</div>
<p><b>Ejemplo de clase (un post de Instagram):</b> en SQL se reparte en las tablas <i>Usuarios, Images, Likes, Posts</i>. En NoSQL es un solo documento <code>post1.json</code> con autor, fecha, imágenes y likes. SQL “evita la redundancia organizándolos en tablas”; NoSQL “usa la redundancia para hacer consultas más rápido”.</p>
<div class="src">BD p.16</div>

<h2>5. Preguntas de cierre del profesor</h2>
<ul><li>¿Qué es una Base de Datos SQL?</li><li>¿Qué es una Base de Datos NoSQL?</li><li>Comparar Base de Datos SQL vs NoSQL y en qué casos utilizar cada una.</li></ul>
`},

{ id: 'monitoreo', deck: 'MO', title: 'Monitoreo de Infraestructura y Aplicaciones', short: 'Qué es monitoreo, reactivo vs proactivo (observabilidad) y CloudWatch.',
  html: `
<h2>1. Desde cero: ¿qué es monitoreo?</h2>
<div class="quote">“La supervisión de la infraestructura y las aplicaciones es simplemente una <b>estrategia de gestión</b>. La estrategia de gestión implica cualquier flujo de trabajo operativo que evalúe los recursos informáticos y las aplicaciones para obtener <b>visibilidad del rendimiento, el estado y la disponibilidad</b> de los servicios que se ejecutan en cualquier infraestructura.”</div>
<div class="src">MO p.5</div>

<h2>2. Reactivo vs proactivo</h2>
<div class="tablewrap"><table>
<tr><th>Monitoreo = <b>Reactivo</b></th><th>Observabilidad = <b>Proactivo</b></th></tr>
<tr><td>Pregunta: ¿mi sistema está funcionando?</td><td>Pregunta: ¿qué está haciendo mi sistema?</td></tr>
<tr><td>Indica <b>QUÉ</b> está sucediendo</td><td>Explica <b>POR QUÉ</b> algo está pasando y da una visión de acción</td></tr>
<tr><td>Se diseña en torno a la recopilación de métricas y registros para detectar <b>problemas conocidos y patrones previamente identificados</b></td><td>Recopila y <b>enriquece la información del monitoreo</b>, con acceso fácil a datos dispares para resolver problemas empresariales complejos</td></tr>
</table></div>
<div class="quote">“La observabilidad permite conocer <b>el por qué</b> de un mal funcionamiento en el sistema, a diferencia del monitoreo que sólo permite detectar <b>dónde</b> están las fallas. La observabilidad es la <b>evolución del monitoreo</b>: tiene la capacidad de descubrir, analizar, reaccionar así como <b>predecir</b> comportamientos de un sistema. También permite transformar datos en informaciones accionables para la toma de decisiones. Comenzó a ganar terreno en <b>2018</b>, permitiendo recabar <b>eventos, métricas, registros y trazas</b>.”</div>
<div class="src">MO p.7</div>

<h2>3. Métricas y herramientas en AWS: Amazon CloudWatch</h2>
<p><b>“Observación de sus recursos y aplicaciones de AWS tanto en AWS como locales.”</b> Es un <b>servicio de monitoreo y observabilidad</b> que <b>recopila datos operativos y de monitoreo en forma de registros, métricas y eventos</b>. Sirve para detectar comportamientos anómalos, <b>establecer alarmas</b>, comparar registros y métricas, <b>realizar acciones automatizadas</b>, resolver problemas y <b>descubrir información para mantener el buen funcionamiento</b> de las aplicaciones.</p>
<div class="src">MO p.9</div>
<h3>Beneficios</h3>
<ul>
 <li><b>Una sola plataforma para la observabilidad</b>: junta métricas, registros y eventos de microservicios para tener <b>visibilidad de todo el sistema</b>.</li>
 <li><b>Recopilación de métricas en AWS y en las instalaciones</b>: integrado de forma nativa con <b>más de 70 servicios</b> (EC2, DynamoDB, S3, ECS, EKS, Lambda). Métricas detalladas de un minuto y personalizadas de hasta un segundo. También funciona en entornos híbridos con el agente o la API.</li>
 <li><b>Mejora del rendimiento operativo y optimización de recursos</b>: <b>alarmas</b> y <b>acciones automáticas según umbrales predefinidos</b> o algoritmos de ML. Ej.: iniciar EC2 Auto Scaling o detener una instancia para reducir la factura. <b>CloudWatch Events</b> desencadena flujos con Lambda, SNS y CloudFormation.</li>
 <li><b>Visibilidad y datos operativos</b>: <b>paneles automáticos</b>, pormenorización de <b>1 segundo</b> y hasta <b>15 meses</b> de conservación de métricas.</li>
 <li><b>Información procesable de registros</b>: con <b>CloudWatch Logs Insights</b> pagas solo por las consultas que ejecutas. Permite crear alarmas y correlacionar registros y métricas en los paneles.</li>
</ul>
<div class="src">MO p.10–11</div>
<h3>Funcionamiento</h3>
{{dia:cw}}
<p>Ejemplo resaltado en clase: “configure acciones automatizadas para que <b>se emita una notificación cuando se desencadene una alarma</b> y <b>comience automáticamente el escalado automático</b>” para <b>reducir el tiempo medio de resolución (MTTR)</b>.</p>
<div class="src">MO p.12</div>
<div class="note">👉 En un diagrama de examen, CloudWatch casi siempre aparece así: <b>métrica → alarma (umbral) → SNS (notificar) y/o Auto Scaling</b>. Lo mismo hace el ejemplo DLQ → alarma → email de SV p.16.</div>

<h2>4. Preguntas de cierre del profesor</h2>
<ul><li>¿Qué es Monitoreo?</li><li>¿Qué diferencias hay entre Reactivo y Proactivo?</li><li>¿Qué métricas y herramientas hay en AWS?</li></ul>
`},
];

/* ───────────── DIAGRAMAS ─────────────
   nodes: [id, etiqueta, categoría, columna, fila, subtítulo?]
   edges: [desde, hasta, etiqueta?, {dash:true}]
   groups: [etiqueta, c1, r1, c2, r2]  · dir:'v' = de arriba hacia abajo */
const DIAGRAMS = {
  todo: { nodes: [
      ['dev','Devices','cliente',0,2.5], ['gh','GitHub Repository','cliente',1,0],
      ['r53','Route 53','web',1,1.5], ['amp','Amplify Console','web',2,0.8], ['cog','Amazon Cognito','web',1,3.2],
      ['api','ToDo API','integracion',2,4], ['l1','addTodo','computo',3,0], ['l2','completeTodo','computo',3,1], ['l3','deleteTodo','computo',3,2],
      ['l4','getAllTodo','computo',3,3], ['l5','getTodo','computo',3,4], ['l6','updateTodo','computo',3,5], ['tb','Items Table','datos',4,2.5,'DynamoDB'] ],
    edges: [['dev','r53'],['dev','cog'],['dev','amp'],['gh','amp'],['dev','api'],['api','l1'],['api','l2'],['api','l3'],['api','l4'],['api','l5'],['api','l6'],['l1','tb'],['l2','tb'],['l3','tb'],['l4','tb'],['l5','tb'],['l6','tb']],
    groups: [['ToDo App (Lambdas)',3,0,3,5]] },
  markdown: { nodes: [
      ['md','Markdown object','cliente',0,1], ['src','Source S3 Bucket','datos',1,1], ['sns','SNS: new object created','integracion',2,1],
      ['q1','Conversion SQS queue','integracion',3,0], ['lh','HTML conversion Lambda','computo',4,0], ['out','Output S3 Bucket','datos',5,0],
      ['q2','Sentiment SQS queue','integracion',3,2], ['ls','Sentiment Lambda','computo',4,2], ['dd','DynamoDB sentiment table','datos',5,2],
      ['cp','Comprehend','ml',4,3.2], ['dlq','Dead Letter queue','integracion',5,3.2], ['al','CloudWatch alarm: DLQ has messages','monitoreo',6,3.2], ['em','SNS Email Notification','integracion',7,3.2] ],
    edges: [['md','src'],['src','sns'],['sns','q1'],['sns','q2'],['q1','lh'],['lh','out'],['q2','ls'],['ls','dd'],['ls','cp','texto ↔ sentimiento'],['ls','dlq','falla',{dash:true}],['dlq','al'],['al','em']] },
  batch: { nodes: [
      ['eb','Regla EventBridge (recurrente)','integracion',0,1], ['get','Get file inventory','computo',1,1], ['pf','Process files (x2)','computo',2,1],
      ['w','Wait 10 seconds','integracion',3,1], ['ag','Aggregate results','computo',4,1], ['del','Delete intermediate results','computo',5,1], ['sns','Amazon SNS','integracion',6,1], ['em','Email notification','cliente',7,1],
      ['oaq','OpenAQ data (S3)','datos',1,2.6], ['int','Intermediate results (S3)','datos',2.5,-0.4], ['fin','Final output (S3)','datos',4,2.6] ],
    edges: [['eb','get'],['get','pf'],['pf','w'],['w','ag'],['ag','del'],['del','sns'],['sns','em','Notify'],['get','oaq','List files previous day'],['oaq','pf','Download'],['pf','int','Upload'],['int','ag','Download'],['ag','fin','Upload'],['del','int','Delete',{dash:true}]],
    groups: [['AWS Step Functions workflow',1,1,6,1]] },
  ingesta: { nodes: [
      ['doc','Documents bucket (S3)','datos',0,1], ['e1','Extract Text (PDF)','computo',1,0], ['e2','Extract Text (DOCX)','computo',1,1], ['e3','Extract Text (JPG)','computo',1,2],
      ['rk','Rekognition','ml',1,3.2], ['stg','Staging bucket','datos',2,0.5], ['sp','Split files','computo',3,0.5], ['qb','Queued bucket','datos',3,2],
      ['add','Add to SQS queue','computo',4,2], ['sqs','SQS queue','integracion',5,2], ['an','Analyze','computo',6,2], ['cp','Comprehend','ml',6,3.2], ['os','OpenSearch (Elasticsearch)','datos',7,2] ],
    edges: [['doc','e1','PDF'],['doc','e2','DOCX'],['doc','e3','JPG'],['e3','rk','Image ↔ Labels'],['e1','stg','Text'],['e2','stg','Text'],['stg','sp','Text'],['sp','qb'],['e3','qb','Labels'],['qb','add'],['add','sqs'],['sqs','an'],['an','cp','Text ↔ Entities'],['an','os','Metadata']] },
  resize: { nodes: [['p','Se toma una foto','cliente',0,0],['s3','Amazon S3','datos',1,0,'la foto se sube a un bucket'],['l','AWS Lambda','computo',2,0,'redimensiona la imagen'],['o','Foto en tamaños web, móvil y tablet','cliente',3,0]],
    edges: [['p','s3'],['s3','l','dispara Lambda'],['l','o']] },
  hashtags: { nodes: [['p','Stream de redes sociales','cliente',0,0],['k','Amazon Kinesis','integracion',1,0,'se carga en tiempo real'],['l','AWS Lambda','computo',2,0,'genera tendencias de hashtags'],['d','Amazon DynamoDB','datos',3,0,'guarda las tendencias'],['u','Usuarios de negocio consultan','cliente',4,0]],
    edges: [['p','k'],['k','l','dispara Lambda'],['l','d'],['d','u']] },
  weather: { nodes: [['s3','Amazon S3','datos',0,0,'front-end de la app del clima'],['u','Usuario pide el clima local','cliente',1,0],['a','API Gateway','integracion',2,0,'llamada REST al endpoint'],['l','AWS Lambda','computo',3,0,'lee el clima y responde'],['d','Amazon DynamoDB','datos',4,0,'datos del clima']],
    edges: [['s3','u'],['u','a'],['a','l','dispara Lambda'],['l','d']] },
  tractor: { nodes: [['p','Sensores del tractor','cliente',0,0],['k','Amazon Kinesis','integracion',1,0,'captura el stream de sensores'],['l','AWS Lambda','computo',2,0,'detecta tendencias y anomalías'],['o','Pedido automático de repuestos','cliente',3,0]],
    edges: [['p','k'],['k','l','dispara Lambda'],['l','o']] },
  status: { nodes: [['u','Usuario publica un estado','cliente',0,0],['a','API Gateway','integracion',1,0,'llamada REST'],['l','AWS Lambda','computo',2,0,'busca amigos e inicia la notificación'],['s','Amazon SNS','integracion',3,0,'envía la notificación push'],['f','Amigos reciben la notificación','cliente',4,0]],
    edges: [['u','a'],['a','l','dispara Lambda'],['l','s'],['s','f']] },
  ecommerce: { nodes: [['w','Retail website','cliente',0,0],['m','Mobile app','cliente',0,1],['p','Point-of-Sale','cliente',0,2],['r','Event Router','integracion',1.3,1,'ingiere, filtra y envía'],
      ['wh','Warehouse Mgmt DB','datos',2.6,0,'inventario'],['fi','Finance System','computo',2.6,1],['cr','Customer Relations','cliente',2.6,2]],
    edges: [['w','r','New order'],['m','r','Question about stock'],['p','r','Return'],['r','wh','New order · Return · Stock'],['r','fi','Return · New order'],['r','cr','New order · Stock']],
    groups: [['Event Producer',0,0,0,2],['Event Consumer',2.6,0,2.6,2]] },
  pedido: { nodes: [['ped','Servicio de Pedidos','computo',0,1,'productor'],['bus','Broker / Bus de eventos','integracion',1.3,1,'PedidoCreado'],
      ['inv','Servicio de Inventario','computo',2.6,0,'actualiza el stock'],['not','Servicio de Notificaciones','computo',2.6,1,'email al cliente'],['an','Servicio de Analítica','computo',2.6,2,'registra la venta']],
    edges: [['ped','bus','1. publica evento'],['bus','inv','2. consume'],['bus','not','3. consume'],['bus','an','4. consume']] },
  sync: { nodes: [['b','Buying Service','computo',0,0],['s','Shipping Service','computo',1.2,0]], edges: [['b','s','↔ directo']], cw: 150 },
  async: { nodes: [['b','Buying Service','computo',0,0],['q','Queue','integracion',1,0],['s','Shipping Service','computo',2,0]], edges: [['b','q'],['q','s']], cw: 150 },
  syncchain: { nodes: [['c','Client','cliente',0,0],['o','Order service','computo',1.2,0],['i','Invoice service','computo',2.4,0]], edges: [['c','o','POST /order → 201'],['o','i','POST /invoice → 201']] },
  v2: { nodes: [['o','Order service','computo',0,1],['i','Invoice service','computo',1.5,0],['f','Fulfillment service','computo',1.5,1],['fc','Forecasting service','computo',1.5,2]], edges: [['o','i'],['o','f'],['o','fc']] },
  fanout: { nodes: [['o','Order service','computo',0,1],['eb','Amazon EventBridge','integracion',1.3,1],['ru','Routing / filtering rules','integracion',1.3,2.3],
      ['i','Invoice service','computo',2.6,0],['f','Fulfillment service','computo',2.6,1],['fc','Forecasting service','computo',2.6,2]],
    edges: [['o','eb'],['ru','eb'],['eb','i'],['eb','f'],['eb','fc']] },
  direct: { nodes: [['b','Buying Service','computo',0,1.5],['e','Email notification','computo',1.3,0],['f','Fraud Service','computo',1.3,1],['s','Shipping Service','computo',1.3,2],['q','SQS Queue','integracion',1.3,3]],
    edges: [['b','e'],['b','f'],['b','s'],['b','q']], cw: 150 },
  pubsub: { nodes: [['b','Buying Service','computo',0,1.5],['t','SNS Topic','integracion',1,1.5],['e','Email notification','computo',2,0],['f','Fraud Service','computo',2,1],['s','Shipping Service','computo',2,2],['q','SQS Queue','integracion',2,3]],
    edges: [['b','t'],['t','e'],['t','f'],['t','s'],['t','q']], cw: 130 },
  snssqs: { nodes: [['b','Buying Service','computo',0,0.5],['t','SNS Topic','integracion',1,0.5],['q1','SQS Queue','integracion',2,0],['q2','SQS Queue','integracion',2,1],['f','Fraud Service','computo',3,0],['s','Shipping Service','computo',3,1]],
    edges: [['b','t'],['t','q1'],['t','q2'],['q1','f'],['q2','s']] },
  mt1: { dir: 'v', nodes: [['t1','Cliente 1','cliente',0,0],['t2','Cliente 2','cliente',1,0],['t3','Cliente 3','cliente',2,0],['app','App','computo',1,1],['db','DB (TENANT_ID)','datos',1,2]],
    edges: [['t1','app'],['t2','app'],['t3','app'],['app','db','WHERE TENANT_ID = ?']], cw: 150 },
  mt2: { dir: 'v', nodes: [['t1','Cliente 1','cliente',0,0],['t2','Cliente 2','cliente',1,0],['t3','Cliente 3','cliente',2,0],['app','App','computo',1,1],['s1','Schema 1','datos',0,2],['s2','Schema 2','datos',1,2],['s3','Schema 3','datos',2,2]],
    edges: [['t1','app'],['t2','app'],['t3','app'],['app','s1'],['app','s2'],['app','s3']], groups: [['Una sola base de datos',0,2,2,2]], cw: 150 },
  mt3: { dir: 'v', nodes: [['t1','Cliente 1','cliente',0,0],['t2','Cliente 2','cliente',1,0],['t3','Cliente 3','cliente',2,0],['app','App','computo',1,1],['d1','DB 1','datos',0,2],['d2','DB 2','datos',1,2],['d3','DB 3','datos',2,2]],
    edges: [['t1','app'],['t2','app'],['t3','app'],['app','d1'],['app','d2'],['app','d3']], cw: 150 },
  cw: { nodes: [['c','Collect','monitoreo',0,0,'métricas y logs de AWS y on-premises'],['m','Monitor','monitoreo',1,0,'dashboards + CloudWatch Alarms'],['a','Act','monitoreo',2,0,'CloudWatch Events y Auto Scaling'],['an','Analyze','monitoreo',3,0,'métricas de 1 s, 15 meses, Metric Math']],
    edges: [['c','m'],['m','a'],['a','an']] },
};
