/* Guía de servicios para el examen (pestaña Servicios).
   Armada a partir del formato del Examen Final real (Prof. Santiago Silva).
   src = diapositiva cuando el servicio está en Clases/; si no, se marca "fuera". */

const EXAM_GUIDE = [
{ t:'1. Entrada: usuarios y APIs', d:'Por dónde entra el cliente (app, web, partner). Es lo único público del diagrama.', items:[
  { id:'apigw', rol:'La puerta de entrada de la API. Valida el JWT (authorizer), aplica throttling, usage plans y API keys, e invoca la Lambda. Tiene tres tipos: <b>REST</b>, <b>HTTP</b> y <b>WebSocket</b> (tiempo real).', donde:'Fuera de la VPC (servicio administrado), entre el cliente y la Lambda.', frase:'“desde su app móvil”, “API pública”, “los clientes se autentican con JWT”', error:'Poner la Lambda directo a internet o dibujar API Gateway dentro de una subnet.', src:'SV p.12, p.21, p.23' },
  { id:'cognito', rol:'Registro e inicio de sesión. Emite <b>tokens JWT con expiración</b> que API Gateway valida.', donde:'Fuera de la VPC, al lado de API Gateway.', frase:'“tokens JWT”, “usuario registrado”, “autenticación”', error:'Validar el token dentro de la Lambda sin indicar el authorizer.', fuera:1 },
  { id:'waf', rol:'Firewall de la API o del CDN: ataques comunes, <b>bots</b> y límites por IP.', donde:'Pegado a API Gateway, CloudFront o el ALB público.', frase:'“protegida contra bots y uso abusivo”, “picos”, “revendedores”', error:'Confundirlo con un security group (WAF filtra HTTP, el security group filtra puertos).', fuera:1 },
  { id:'cloudfront', rol:'CDN para el frontend estático (S3) y caché cerca del usuario.', donde:'Fuera de la VPC, delante de S3 (y opcionalmente de la API).', frase:'“web”, “SPA”, “miles de usuarios al abrir la venta”', error:'Olvidar el frontend: el profesor ve de dónde sale la web.', fuera:1 },
  { id:'vpclink', rol:'Conecta API Gateway con <b>contenedores o EC2 privados</b> detrás de un NLB o ALB <b>interno</b>.', donde:'En el borde de la VPC o en la subnet privada, entre API Gateway y el balanceador interno.', frase:'“el backend son contenedores”, “no exponer los microservicios”', error:'Ponerlo delante de una Lambda (no hace falta).', fuera:1 },
  { id:'alb', rol:'Balanceador HTTP que reparte entre contenedores o instancias en 2 AZ y enruta por ruta (<code>/catalogo</code>, <code>/pedidos</code>).', donde:'<b>Público</b> → subnet pública (si recibe internet). <b>Interno</b> → subnet privada (detrás de un VPC Link).', frase:'“microservicios”, “alta disponibilidad”, “balanceo de carga”', error:'Poner los contenedores en la subnet pública junto al ALB.', fuera:1 },
]},
{ t:'2. Cómputo', d:'Dónde corre tu código. En el examen casi siempre va en <b>subnets privadas</b>.', items:[
  { id:'lambda', rol:'Funciones serverless que se ejecutan por un evento: la lógica de cada paso. Tienen máximo 15 min, la CPU sube con la memoria y hay cold start.', donde:'<b>Subnet privada</b> (Lambda conectada a la VPC) cuando debe llegar a recursos privados o on-premise.', frase:'“Serverless”, “servicios mínimos: Lambda”', error:'Una sola Lambda gigante que hace todo. Mejor una por paso (LM p.16: “small and single-purpose”).', src:'SV p.11 · LM p.5–16' },
  { id:'ecs', rol:'Contenedores (Docker) administrados. Cada microservicio es un servicio ECS con Auto Scaling, sobre <b>Fargate</b> o EC2.', donde:'Subnet privada, detrás de un ALB o NLB.', frase:'“microservicios en contenedores”, “no se va a reescribir a Lambda”', error:'Usar Lambda para procesos de más de 15 minutos.', src:'SV p.11 · CT p.11–13' },
  { id:'ec2', rol:'Máquinas virtuales (instancias). Se pagan por compute, storage (EBS) y data out.', donde:'Subnet privada, en un Auto Scaling group de 2 AZ.', frase:'“instancias”, “servidor”, “software que no corre en Lambda”', error:'Dejar las instancias con IP pública.', src:'VM p.8–13' },
]},
{ t:'3. Orquestación y mensajería (asíncrono)', d:'Lo que no tiene que responder al instante se desacopla. Es el corazón de las preguntas tipo Saga.', items:[
  { id:'stepfunctions', rol:'Orquesta los pasos: <b>Saga</b> con <code>Retry</code> y <code>Catch</code> (compensación), <code>Choice</code> (reglas de negocio), <code>Parallel</code>, <code>Map</code> (lotes), <code>Wait</code> y <code>.waitForTaskToken</code> (esperar a un humano o a un pago sin costo).', donde:'Fuera de la VPC. Desde Lambdas privadas se llega por un Interface endpoint (states).', frase:'“revertir”, “patrón Saga”, “reintentos”, “aprobación humana”, “puede tardar días”, “si … entonces …”', error:'Encadenar Lambdas que se llaman entre sí (síncrono y acoplado, EV p.16).', src:'SV p.12, p.17' },
  { id:'sqs', rol:'Cola: desacopla y absorbe picos. El productor no espera al consumidor. Con <b>DLQ</b> los mensajes que fallan no se pierden.', donde:'Fuera de la VPC (Interface endpoint desde subnets privadas).', frase:'“picos”, “tolerar intermitencias”, “no perder”, “reintentar”, “enviar al ERP”', error:'Poner una cola sin consumidor, o reintentar sin DLQ.', src:'SV p.12, p.16 · EV p.15, p.21' },
  { id:'sns', rol:'Pub/sub: un mensaje a muchos destinos. Notificaciones a personas por <b>SMS</b> o push (A2P).', donde:'Fuera de la VPC.', frase:'“notificar al cliente por SMS”, “avisar a conductor, operaciones y cliente”', error:'Usarlo para correos transaccionales con PDF (mejor SES).', src:'SV p.12 · EV p.12, p.20–22' },
  { id:'eventbridge', rol:'Bus de eventos con <b>reglas que filtran por contenido</b>. También sirve para tareas programadas (cron y Scheduler: “24 h antes”).', donde:'Fuera de la VPC.', frase:'“cuando se crea X, avisar a varios servicios”, “cada noche”, “recordatorio”', error:'Usar el TTL de DynamoDB para algo que debe ocurrir a una hora exacta.', src:'SV p.12, p.17 · EV p.12, p.18–19' },
  { id:'kinesis', rol:'Streaming en tiempo real (IoT, ubicaciones, clics) que dispara una Lambda.', donde:'Fuera de la VPC.', frase:'“cada sensor envía…”, “cada 5 segundos”, “tiempo real”', error:'Mandar miles de lecturas por segundo a API Gateway → Lambda una por una.', src:'SV p.20, p.22' },
]},
{ t:'4. Datos', d:'Archivos → S3. Registros → DynamoDB (o SQL si lo piden). El “Se pide” suele exigir las <b>tablas con PK/SK</b>.', items:[
  { id:'dynamodb', rol:'NoSQL serverless con respuesta en milisegundos. Usa <b>escrituras condicionales</b> para la idempotencia y para evitar la sobreventa, y <b>TTL</b> para limpiar datos viejos.', donde:'Fuera de la VPC. Desde subnets privadas por el <b>Gateway endpoint</b> (gratis).', frase:'“tablas de DynamoDB con su clave (PK/SK)”, “en milisegundos”, “no debitar dos veces”', error:'No escribir la PK/SK, o no explicar el patrón de acceso.', src:'SV p.13 · BD p.12, p.15' },
  { id:'s3', rol:'Archivos: fotos, PDF, XML, CSV, comprobantes. Usa <b>URLs prefirmadas</b> (subida o descarga directa), SSE-KMS, ciclo de vida a Glacier y Object Lock (retención).', donde:'Fuera de la VPC. Desde subnets privadas por el Gateway endpoint.', frase:'“sube fotos / PDF”, “sin que los archivos pasen por la API”, “conservar 5 años”', error:'Subir archivos pesados a través de API Gateway → Lambda.', src:'SV p.13, p.16, p.19' },
  { id:'rds', rol:'Base relacional (Aurora o RDS), con <b>Multi-AZ</b> para alta disponibilidad.', donde:'<b>Subnet privada</b> de datos.', frase:'“base de datos relacional”, “transacciones”, “datos financieros”', error:'Ponerla en la subnet pública o con la contraseña en el código.', src:'BD p.15 (SQL)', fuera:1 },
  { id:'elasticache', rol:'Caché en memoria para respuestas ultrarrápidas.', donde:'Subnet privada.', frase:'“responder en milisegundos” (con bases SQL)', error:'—', src:'SV p.13' },
]},
{ t:'5. Red (VPC)', d:'Lo que el “Se pide” nombra explícitamente: VPC, subnets públicas y privadas, VPC Endpoints, NAT Gateway.', items:[
  { id:'vpc', rol:'Tu red privada. Se dibuja como una caja con <b>subnets públicas</b> (ALB, NAT) y <b>privadas</b> (Lambdas, contenedores, BD) en <b>2 AZ</b>.', donde:'Una caja grande dentro de “AWS Cloud / Región”.', frase:'“indicando VPC, subnets públicas y privadas”', error:'Dibujar la VPC sin distinguir subnets públicas y privadas, o con una sola AZ.', fuera:1 },
  { id:'nat', rol:'Permite que lo privado <b>salga</b> a internet (API de un tercero) sin que nadie entre.', donde:'<b>Subnet pública</b>, con un Internet Gateway hacia afuera (uno por AZ).', frase:'“API de un tercero”, “pasarela de pagos externa”, “OSE/SUNAT”, “central de riesgo”', error:'Usar el NAT para llegar a DynamoDB o S3 (para eso están los endpoints).', fuera:1 },
  { id:'igw', rol:'Conecta la VPC con internet (necesario para el NAT y el ALB público).', donde:'En el borde de la VPC.', frase:'(implícito cuando hay NAT o ALB público)', error:'—', fuera:1 },
  { id:'vpce', rol:'Acceso privado a servicios de AWS sin internet. <b>Gateway</b>: S3 y DynamoDB. <b>Interface</b>: Secrets Manager, SNS, SQS, Step Functions, KMS, Rekognition, Textract, SageMaker…', donde:'Dentro de la VPC, entre las Lambdas privadas y el servicio.', frase:'“VPC Endpoints”, “no deben consumirse a través de internet”', error:'Olvidar el endpoint de Secrets Manager (la Lambda no podría leer el secreto).', fuera:1 },
]},
{ t:'6. Conexión on-premise (híbrida)', d:'Core bancario, SAP, HIS, sistema financiero: siempre van en una caja “Datacenter / on-premise”.', items:[
  { id:'dx', rol:'Enlace dedicado y privado al datacenter, estable y de gran ancho de banda.', donde:'Entre el Virtual Private Gateway (VPC) y la caja on-premise.', frase:'“conectado por VPN / Direct Connect”, “core on-premise”, “ERP on-premise”', error:'Llamar al core por internet o por el NAT.', fuera:1 },
  { id:'vpn', rol:'Túnel IPsec cifrado por internet. Rápido de montar y suele ser el respaldo de Direct Connect.', donde:'Igual que Direct Connect: dibuja “Direct Connect + VPN de respaldo”.', frase:'“VPN”, “sedes”, “datacenter de la clínica”', error:'—', fuera:1 },
  { id:'transfer', rol:'SFTP administrado que guarda en S3 (archivos del ERP o del banco).', donde:'Endpoint interno en la VPC, alcanzado por VPN o Direct Connect.', frase:'“envía un archivo por SFTP”, “lote”', error:'—', fuera:1 },
]},
{ t:'7. Seguridad', d:'Cada requisito de seguridad del enunciado se responde con uno de estos servicios.', items:[
  { id:'secrets', rol:'Guarda API keys, la clave SOL y las credenciales del core o de la BD. Se leen en tiempo de ejecución con el rol IAM.', donde:'Fuera de la VPC. Desde subnets privadas por un Interface endpoint.', frase:'“las credenciales no pueden estar en el código ni en variables de entorno”', error:'Ponerlas en variables de entorno de la Lambda (el enunciado lo prohíbe).', fuera:1 },
  { id:'kms', rol:'Llaves de cifrado en reposo (S3, DynamoDB, RDS, secretos).', donde:'Al lado de los almacenes de datos, o escrito en la etiqueta: “SSE-KMS”.', frase:'“datos cifrados”, “datos sensibles / de salud”, “Ley de protección de datos”', error:'—', fuera:1 },
  { id:'iam', rol:'Rol con permisos mínimos para cada Lambda o tarea. Sin access keys.', donde:'Basta con escribirlo en la explicación.', frase:'(siempre)', error:'—', fuera:1 },
]},
{ t:'8. Notificaciones', d:'El enunciado casi siempre termina con “notificar al cliente”.', items:[
  { id:'sns', rol:'SMS y push.', donde:'Fuera de la VPC.', frase:'“por SMS”', error:'—', src:'EV p.22' },
  { id:'ses', rol:'Correo transaccional (comprobantes, PDF, confirmaciones).', donde:'Fuera de la VPC.', frase:'“por correo”, “enviar el PDF al cliente”', error:'—', fuera:1 },
]},
{ t:'9. IA y monitoreo', d:'IA solo si el enunciado la pide. El monitoreo y la trazabilidad siempre suman puntos.', items:[
  { id:'rekognition', rol:'Analiza imágenes (con Custom Labels para casos específicos, como daños).', donde:'Fuera de la VPC, por un Interface endpoint.', frase:'“analizar las fotos con IA”, “reconocimiento facial”', error:'Consumirlo por internet cuando el enunciado lo prohíbe.', src:'SV p.18' },
  { id:'textract', rol:'Extrae texto y campos de PDF o documentos escaneados.', donde:'Fuera de la VPC, por un Interface endpoint.', frase:'“extraer los datos de la denuncia / DNI / boletas”', error:'—', fuera:1 },
  { id:'comprehend', rol:'Analiza texto (sentimiento, entidades).', donde:'Fuera de la VPC.', frase:'“analizar comentarios / sentimiento”', error:'—', src:'SV p.16, p.18' },
  { id:'cloudwatch', rol:'Métricas, logs y <b>alarmas por umbral</b> (por ejemplo, sobre la DLQ) → SNS o Auto Scaling.', donde:'Fuera de la VPC, conectado con línea punteada a lo que monitorea.', frase:'“monitorear”, “alertar”, “umbral”', error:'Olvidarlo: siempre suma.', src:'MO p.9–12' },
  { id:'cloudtrail', rol:'Auditoría: quién hizo qué y cuándo. Junto con el historial de Step Functions y una tabla de eventos da <b>trazabilidad</b>.', donde:'Fuera de la VPC.', frase:'“trazabilidad completa”, “auditoría”', error:'—', fuera:1 },
]},
];

/* Requisito del enunciado → servicio / patrón (sacado de las 3 preguntas del Examen Final) */
const REQ_MAP = [
  ['“Ningún componente de cómputo debe ser accesible desde internet”', 'Lambdas, contenedores y BD en <b>subnets privadas</b>. Solo API Gateway es público. Salida por <b>NAT</b> y acceso a AWS por <b>VPC Endpoints</b>.', 'P1'],
  ['“Las credenciales no pueden estar en el código ni en variables de entorno”', '<b>Secrets Manager</b> + rol IAM + Interface endpoint.', 'P1 · P2 · P3'],
  ['“Una misma transferencia no debe debitarse dos veces (idempotencia)”', 'Tabla <b>Idempotencia</b> en DynamoDB con <code>attribute_not_exists(PK)</code>, débito condicional y nombre de ejecución de Step Functions = id.', 'P1'],
  ['“Debe contemplar el manejo de errores y reintentos”', '<code>Retry</code> con backoff + <code>Catch</code> en <b>Step Functions</b>, <b>SQS con DLQ</b> y alarma de <b>CloudWatch</b>.', 'P1'],
  ['“Si … falla, el débito / stock debe revertirse / liberarse”', '<b>Patrón Saga</b> en Step Functions: <code>Catch</code> → paso de compensación.', 'P1 · P2'],
  ['“La API pública debe estar protegida contra bots y uso abusivo”', '<b>AWS WAF</b> (Bot Control, reglas por tasa) + <b>throttling / usage plans</b> de API Gateway + Cognito.', 'P2'],
  ['“Debe evitarse la sobreventa de stock”', '<b>Escritura condicional / transacción</b> en DynamoDB (<code>stock &gt;= cantidad</code>).', 'P2'],
  ['“Debe tolerar intermitencias del OSE/SUNAT (tercero)”', '<code>Retry</code> con backoff + <b>cola SQS</b> para reintentar después + DLQ. La venta no se bloquea.', 'P2'],
  ['“Responder en milisegundos”', '<b>DynamoDB</b> (o ElastiCache / caché de API Gateway).', 'P2'],
  ['“Se conservan durante 5 años”', '<b>S3</b> con ciclo de vida a Glacier + <b>Object Lock</b>.', 'P2'],
  ['“Picos de 5,000 pedidos por minuto”', 'Lambda escala sola + concurrencia reservada + <b>SQS</b> como amortiguador + throttling.', 'P2'],
  ['“Sin que los archivos pesados pasen por la API”', '<b>URLs prefirmadas de S3</b>: la app sube directo a S3.', 'P3'],
  ['“El flujo debe poder esperar días sin costo de cómputo”', '<b>Step Functions Standard</b> con <code>.waitForTaskToken</code> (callback).', 'P3'],
  ['“Los servicios de IA no deben consumirse a través de internet”', 'Lambdas privadas + <b>Interface endpoints</b> de Rekognition y Textract.', 'P3'],
  ['“Si la póliza no está vigente se rechaza y se notifica”', 'Estado <code>Choice</code> en Step Functions → rechazar → <b>SNS/SES</b>.', 'P3'],
  ['“Trazabilidad completa del proceso”', 'Historial de Step Functions + tabla <b>Eventos</b> (PK = id, SK = fecha) + <b>CloudTrail</b> + CloudWatch Logs.', 'P3'],
  ['“Conectado por VPN / Direct Connect” / “ERP on-premise”', 'Virtual Private Gateway + <b>Direct Connect</b> (VPN de respaldo) → caja “Datacenter”.', 'P1 · P2 · P3'],
];

const CHECKLIST = [
  'Caja <b>AWS Cloud / Región</b> y dentro la <b>VPC</b>, con <b>subnets públicas y privadas</b> (escribe “2 AZ”).',
  'Todo el <b>cómputo y las bases de datos en subnets privadas</b>. En la pública solo va el NAT (y el ALB si es público).',
  '<b>NAT Gateway + Internet Gateway</b> si hay un tercero en internet.',
  '<b>VPC Endpoints</b>: Gateway (DynamoDB, S3) e Interface (Secrets Manager, SNS, SQS, Step Functions, IA).',
  '<b>Conexión on-premise</b>: VGW → Direct Connect / VPN → caja “Datacenter” con el core, SAP o HIS.',
  'Los <b>servicios mínimos</b> del enunciado (API Gateway, Lambda, Step Functions, DynamoDB, S3, Secrets Manager…) aparecen y se usan.',
  '<b>Tablas DynamoDB con PK y SK</b> (y para qué consulta sirve cada una).',
  'Cada <b>requerimiento</b> resuelto y señalado en el diagrama (idempotencia, reintentos, Saga, credenciales…).',
  '<b>Flechas rotuladas</b> (POST, StartExecution, evento, guarda, notifica) y numeradas en el orden del flujo.',
  'Notificación final al cliente (SNS/SES) y <b>CloudWatch</b> para el monitoreo.',
];

Object.assign(DIAGRAMS, {
  x_plantilla: { cw: 205, nodes: [
      ['cli','Cliente (app / web)','cliente',0,1.6], ['cog','Cognito','seguridad',1,0.6,'JWT'], ['api','API Gateway + WAF','integracion',1,1.6,'authorizer · throttling'],
      ['sfn','Step Functions','integracion',1,2.6,'Saga · Retry/Catch · Choice'], ['cw','CloudWatch','monitoreo',1,4.2,'métricas · alarmas'],
      ['l1','λ entrada','computo',2,1.6,'idempotencia'], ['l2','λ pasos de negocio','computo',2,3.4], ['l3','λ tercero / on-premise','computo',3,1.0], ['l4','λ notificar','computo',3,4.2],
      ['nat','NAT Gateway','red',4,0.0], ['e1','VPC Endpoint (Gateway)','red',4,1.6,'DynamoDB · S3'], ['e2','VPC Endpoint (Interface)','red',4,2.8,'Secrets · SNS · SQS · States'], ['vgw','Virtual Private Gateway','red',4,4.0],
      ['igw','Internet Gateway','red',5,0.0], ['ddb','DynamoDB / S3','datos',5,1.6,'tablas PK / SK'], ['sm','Secrets Manager','seguridad',5,2.6], ['sns','SNS / SES','integracion',5,3.4,'SMS · correo'], ['dx','Direct Connect','red',5,4.4,'+ VPN respaldo'],
      ['ext','API de un tercero','cliente',6,0.0], ['onp','Core / ERP','cliente',6,4.4] ],
    edges: [['cli','cog'],['cli','api','1. POST'],['api','l1','2'],['l1','sfn','3. StartExecution'],['l1','e1'],['sfn','l2','4'],['sfn','l3'],['sfn','l4'],['l2','e1'],['l3','nat'],['nat','igw'],['igw','ext'],['l3','e2'],['l3','vgw'],['vgw','dx'],['dx','onp'],['l4','e2'],['e1','ddb'],['e2','sm'],['e2','sns']],
    groups: [['AWS Cloud · Región',1,0.0,5,4.4,'cloud'],['VPC (2 AZ)',2,0.0,4,4.4,'vpc'],['Subnet pública',4,0.0,4,0.0,'pub'],['Subnets privadas',2,1.0,3,4.2,'priv'],['Datacenter',6,4.4,6,4.4,'onprem']] },
});

function examGuideHtml() {
  const svcLink = id => SVC[id] ? `<a href="#/servicios" data-j="${id}"><span class="cat" style="background:${CATS[SVC[id].cat].color}"></span><b>${SVC[id].name}</b></a>` : id;
  return `<h2>Guía para el examen: qué servicios usar y dónde dibujarlos</h2>
  <p>Armada a partir de las 3 preguntas del Examen Final (Prof. Santiago Silva). Todas piden un <b>diagrama 100% AWS</b> con VPC, subnets, VPC Endpoints, NAT, conexión on-premise y tablas DynamoDB con PK/SK.</p>
  <div class="note"><span class="tag warn">fuera de las diapositivas</span> Los servicios marcados así no están en <code>Clases/</code>: es conocimiento general de AWS. Los demás citan su diapositiva.</div>
  <details open class="card"><summary>Plantilla base del diagrama (se repite en todas las preguntas)</summary>
    ${Diagram.legend(['cliente', 'computo', 'integracion', 'datos', 'red', 'seguridad', 'monitoreo'])}${Diagram.render('x_plantilla')}
    <p>Cliente → API Gateway (JWT, WAF) → Lambda de entrada (idempotencia) → <b>Step Functions</b> orquesta los pasos → las Lambdas privadas usan <b>endpoints</b> para AWS, el <b>NAT</b> para terceros y <b>Direct Connect / VPN</b> para on-premise → notificación con SNS/SES. Adapta esta base a cada enunciado.</p></details>
  ${EXAM_GUIDE.map(sec => `<details class="card"><summary>${sec.t}</summary><p>${sec.d}</p>
    <div class="tablewrap"><table><tr><th>Servicio</th><th>Para qué en el examen</th><th>Dónde se dibuja</th><th>Frase del enunciado que lo pide</th><th>Error típico</th></tr>
    ${sec.items.map(it => `<tr><td>${svcLink(it.id)}<br>${it.fuera ? '<span class="tag warn">fuera de las diapositivas</span>' : `<span class="src" style="margin:0">${it.src}</span>`}</td><td>${it.rol}</td><td>${it.donde}</td><td><i>${it.frase}</i></td><td>${it.error}</td></tr>`).join('')}
    </table></div></details>`).join('')}
  <details class="card"><summary>Requerimiento del enunciado → servicio o patrón</summary>
    <div class="tablewrap"><table><tr><th>Si el enunciado dice…</th><th>Usa…</th><th>Pregunta</th></tr>${REQ_MAP.map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('')}</table></div>
    <p class="src">P1 = Transferencias, P2 = SUNAT, P3 = Siniestros (Examen Final). Resueltas en <a href="#/examen">Casos examen</a>.</p></details>
  <details class="card"><summary>✅ Checklist antes de entregar el diagrama</summary><ol class="steps">${CHECKLIST.map(c => `<li>${c}</li>`).join('')}</ol></details>`;
}
