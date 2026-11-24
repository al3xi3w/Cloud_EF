/* Casos tipo examen (VPC, subnets, endpoints, on-premise, Saga, idempotencia, PK/SK).
   IMPORTANTE: este contenido NO está en las diapositivas de Clases/. Es conocimiento general de AWS,
   agregado porque el examen pide este tipo de diagramas. Todo lo marcado fuera:'general' lo indica en la web. */

Object.assign(CATS, {
  red:       { name: 'Red y conectividad', color: '#1c7ed6' },
  seguridad: { name: 'Seguridad e identidad', color: '#e03131' },
});

const GENERAL = 'general';
SERVICES.push(
  // ── cómputo: instancias y microservicios ──
  { id:'ec2', name:'Amazon EC2', cat:'computo', fuera:GENERAL,
    que:'Máquinas virtuales (<b>instancias</b>) en la nube. Eliges el tipo de instancia (CPU y RAM), la imagen del sistema operativo (AMI) y la red. Tú administras el sistema operativo, los parches y el escalado.',
    src:'En clase solo aparece en CloudWatch: puede iniciar EC2 Auto Scaling o detener una instancia (MO p.10)',
    cuando:['Cuando necesitas control del sistema operativo, procesos de más de 15 minutos (el límite de Lambda, LM p.8) o software que no corre en Lambda ni en contenedores.','En arquitecturas: instancias en <b>subnets privadas</b>, detrás de un <b>ALB</b> y dentro de un <b>Auto Scaling group</b> repartido en 2 AZ.'],
    ejemplos:['Alternativa a ECS Fargate en el ejemplo de microservicios'] },
  { id:'asg', name:'EC2 Auto Scaling', cat:'computo', fuera:GENERAL,
    que:'Mantiene un <b>grupo de instancias</b> entre un mínimo y un máximo. Agrega o quita instancias según métricas de CloudWatch (<b>escalado horizontal</b>), reemplaza las que fallan y las reparte en varias AZ.',
    src:'MO p.10–12 (CloudWatch dispara el escalado automático)',
    cuando:['Picos de carga predecibles o no (campañas, matrícula).','Alta disponibilidad: si una instancia o una AZ cae, el grupo lanza otra.'],
    ejemplos:['Ejemplo microservicios (Service Auto Scaling de ECS funciona igual con tareas)'] },
  { id:'ecs', name:'Amazon ECS', cat:'computo', fuera:GENERAL,
    que:'Orquestador de <b>contenedores</b> de AWS. Cada <b>microservicio</b> es un <i>servicio ECS</i> que mantiene N tareas (contenedores) corriendo. Puede usar <b>Fargate</b> (sin administrar servidores) o instancias EC2.',
    src:'En clase: Fargate “funciona con ECS y EKS” (SV p.11)',
    cuando:['Microservicios en contenedores (Docker) que corren todo el tiempo, con más de 15 minutos de ejecución o con mucho tráfico constante.','Cada servicio escala por separado (Service Auto Scaling) detrás de un ALB.'],
    ejemplos:['Catálogo, pedidos y pagos en el ejemplo de microservicios'] },
  { id:'eks', name:'Amazon EKS', cat:'computo', fuera:GENERAL,
    que:'<b>Kubernetes</b> administrado por AWS. Mismo rol que ECS, pero con Kubernetes.',
    src:'SV p.11 (Fargate funciona con EKS)', cuando:['Cuando el equipo ya usa Kubernetes o necesita portabilidad entre nubes.'], ejemplos:['—'] },
  { id:'ecr', name:'Amazon ECR', cat:'computo', fuera:GENERAL,
    que:'Registro privado de <b>imágenes de contenedores</b> (Docker). ECS y EKS descargan de aquí las imágenes de cada microservicio.',
    src:'—', cuando:['Siempre que uses ECS o EKS. Desde subnets privadas se accede por VPC endpoint o NAT.'], ejemplos:['Ejemplo microservicios'] },
  { id:'rds', name:'Amazon RDS / Aurora (Multi-AZ)', cat:'datos', fuera:GENERAL,
    que:'Base de datos <b>relacional</b> administrada (MySQL, PostgreSQL, etc.). <b>Multi-AZ</b> mantiene una réplica en otra AZ con failover automático. Aurora agrega réplicas de lectura.',
    src:'Cuándo usar SQL: BD p.15 (datos consistentes, transaccionales)',
    cuando:['Datos relacionales con transacciones: vacantes, pagos, inventario.','Siempre en <b>subnets privadas</b>, con la contraseña en Secrets Manager.'],
    ejemplos:['Pedidos (ejemplo microservicios)','Secciones y vacantes (práctica de matrícula)'] },
  // ── red ──
  { id:'vpc', name:'Amazon VPC y subnets', cat:'red', fuera:GENERAL, nopal:true,
    que:'Tu <b>red privada aislada</b> dentro de una región. Se divide en <b>subnets</b>, cada una en una AZ. <b>Subnet pública</b>: su tabla de rutas envía 0.0.0.0/0 al Internet Gateway. <b>Subnet privada</b>: no tiene esa ruta, así que nadie de internet puede llegar a ella. <b>Security groups</b>: firewall de cada recurso.',
    src:'—',
    cuando:['En la subnet <b>pública</b> va solo lo que debe recibir o salir a internet: ALB, NAT Gateway.','En la subnet <b>privada</b> va el cómputo y las bases de datos: Lambdas con VPC, contenedores, instancias, RDS.','Usa 2 AZ (dos subnets privadas y dos públicas) para alta disponibilidad.'],
    ejemplos:['Todos los casos tipo examen'] },
  { id:'igw', name:'Internet Gateway', cat:'red', fuera:GENERAL,
    que:'Conecta la VPC con internet. Las subnets públicas lo usan como ruta por defecto.',
    src:'—', cuando:['Siempre que haya un ALB público o un NAT Gateway.'], ejemplos:['Transferencias, microservicios'] },
  { id:'nat', name:'NAT Gateway', cat:'red', fuera:GENERAL,
    que:'Va en una <b>subnet pública</b>. Permite que lo que está en subnets privadas <b>salga</b> a internet (por ejemplo, para llamar a la API de un tercero) <b>sin que nadie de internet pueda entrar</b>. Se pone uno por AZ y cobra por hora y por GB.',
    src:'—',
    cuando:['La Lambda o el contenedor privado debe llamar a una <b>API externa</b>: antifraude, pasarela de pagos, proveedor.','No lo uses para hablar con DynamoDB, S3 u otros servicios de AWS: para eso existen los VPC endpoints, que son privados y más baratos.'],
    ejemplos:['Antifraude externo (ejemplo transferencias)'] },
  { id:'vpce', name:'VPC Endpoint', cat:'red', fuera:GENERAL,
    que:'Conexión <b>privada</b> desde la VPC a servicios de AWS sin pasar por internet ni por el NAT. <b>Gateway endpoint</b>: solo para <b>S3 y DynamoDB</b>, gratis, se agrega a la tabla de rutas. <b>Interface endpoint</b> (PrivateLink): una interfaz con IP privada en tu subnet para otros servicios (Secrets Manager, SQS, SNS, Step Functions, KMS, CloudWatch Logs, API Gateway privada…), con costo por hora.',
    src:'—',
    cuando:['Lambdas o contenedores en subnets privadas que usan DynamoDB, S3, Secrets Manager, SNS, SQS o Step Functions.','Cuando el requisito dice “el tráfico no debe salir a internet”.'],
    ejemplos:['Gateway para DynamoDB e Interface para Secrets Manager y SNS (transferencias)'] },
  { id:'vpn', name:'AWS Site-to-Site VPN', cat:'red', fuera:GENERAL,
    que:'Túnel <b>IPsec cifrado</b> por internet entre el datacenter (customer gateway) y la VPC (Virtual Private Gateway o Transit Gateway). Se monta rápido, pero su ancho de banda y latencia varían.',
    src:'—', cuando:['Conectar con sistemas <b>on-premise</b> rápido o con poco tráfico.','Como <b>respaldo</b> de Direct Connect.'], ejemplos:['Clínica: el laboratorio on-premise envía resultados'] },
  { id:'dx', name:'AWS Direct Connect', cat:'red', fuera:GENERAL,
    que:'<b>Enlace dedicado y privado</b> (no pasa por internet) entre el datacenter y AWS. Tiene latencia estable y gran ancho de banda, pero tarda semanas en instalarse. No va cifrado por defecto: se puede poner una VPN encima o usar MACsec.',
    src:'—', cuando:['Integración crítica y constante con un <b>core on-premise</b>: core bancario, ERP.','Lo usual es Direct Connect como enlace principal y VPN como respaldo.'], ejemplos:['Core bancario en San Isidro (transferencias)'] },
  { id:'alb', name:'Application Load Balancer', cat:'red', fuera:GENERAL,
    que:'Balanceador de carga HTTP/HTTPS (Elastic Load Balancing). Reparte el tráfico entre instancias, contenedores o Lambdas de <b>varias AZ</b>, enruta por ruta (<code>/catalogo</code>, <code>/pedidos</code>) hacia cada microservicio y hace health checks.',
    src:'Sílabo 6.5.3 Balanceo de carga (sin diapositivas en Clases/)',
    cuando:['Delante de microservicios en ECS o EC2. El ALB va en <b>subnets públicas</b> y los destinos en <b>privadas</b>.'], ejemplos:['Ejemplo microservicios'] },
  { id:'cloudfront', name:'Amazon CloudFront', cat:'web', fuera:GENERAL,
    que:'Red de distribución de contenido (<b>CDN</b>). Cachea el contenido estático (por ejemplo, desde S3) cerca del usuario, con HTTPS, y se integra con WAF.',
    src:'—', cuando:['Frontend web estático en S3 servido a muchos usuarios.'], ejemplos:['Ejemplo microservicios, práctica de matrícula'] },
  // ── seguridad ──
  { id:'waf', name:'AWS WAF', cat:'seguridad', fuera:GENERAL,
    que:'Firewall de aplicaciones web para <b>API Gateway, ALB y CloudFront</b>. Tiene reglas contra inyección SQL, XSS, bots y límites de solicitudes por IP.',
    src:'—', cuando:['Apps expuestas a internet, sobre todo de banca y pagos.'], ejemplos:['Transferencias'] },
  { id:'secrets', name:'AWS Secrets Manager', cat:'seguridad', fuera:GENERAL,
    que:'Guarda <b>secretos</b> (API keys, contraseñas de base de datos) cifrados con KMS. La Lambda o el contenedor los leen <b>en tiempo de ejecución</b> con su rol IAM (<code>GetSecretValue</code>). Permite rotación automática.',
    src:'—',
    cuando:['Cuando el requisito dice “las credenciales no pueden estar en el código ni en variables de entorno”.','Para la API key de un tercero y las credenciales del core o de la base de datos.'],
    ejemplos:['API key del antifraude y credenciales del core (transferencias)'] },
  { id:'kms', name:'AWS KMS', cat:'seguridad', fuera:GENERAL,
    que:'Administra las <b>llaves de cifrado</b>. Cifra en reposo S3, DynamoDB, RDS y Secrets Manager, y registra quién usa cada llave.',
    src:'Sílabo 6.7.3 Cifrado de información sensible (sin diapositivas en Clases/)', cuando:['Datos sensibles: salud, banca, biometría.'], ejemplos:['Resultados de laboratorio (clínica)'] },
  { id:'iam', name:'IAM (roles y políticas)', cat:'seguridad', fuera:GENERAL,
    que:'Cada Lambda o tarea tiene un <b>rol</b> con permisos mínimos. AWS le da credenciales temporales automáticamente, sin access keys en el código.',
    src:'Sílabo 6.7.1 Gestión de usuarios y accesos', cuando:['Siempre. En el diagrama basta con indicar “rol IAM con permisos mínimos”.'], ejemplos:['Todos'] },
  { id:'cloudtrail', name:'AWS CloudTrail', cat:'monitoreo', fuera:GENERAL,
    que:'Registra <b>quién hizo qué y cuándo</b> en la API de AWS. Con <i>data events</i> registra los accesos a objetos de S3 y a items de DynamoDB, lo que sirve como <b>auditoría</b>.',
    src:'—', cuando:['Requisitos de auditoría o de protección de datos personales.'], ejemplos:['Clínica'] },
  { id:'iotcore', name:'AWS IoT Core', cat:'integracion', fuera:GENERAL,
    que:'Conecta dispositivos por <b>MQTT</b>, autenticados con <b>certificados X.509</b>. Sus <i>reglas</i> reenvían los mensajes a Kinesis, Lambda, DynamoDB o SQS.',
    src:'En clase, los sensores van directo a Kinesis (SV p.22)', cuando:['Flotas de sensores que necesitan identidad segura por dispositivo.'], ejemplos:['Práctica de cadena de frío'] },
  { id:'ses', name:'Amazon SES', cat:'integracion', fuera:GENERAL,
    que:'Envío de <b>correos transaccionales</b> a clientes: confirmaciones, comprobantes.',
    src:'—', cuando:['Correo al cliente. Para SMS se usa SNS (EV p.22).'], ejemplos:['Matrícula, pagos'] },
);
Object.assign(SVC, Object.fromEntries(SERVICES.map(s => [s.id, s])));
SVC.cognito.cuando.push('<span class="tag warn">fuera de las diapositivas</span> Un <b>User Pool</b> autentica a los usuarios y emite <b>tokens JWT con expiración</b>. API Gateway los valida con un <i>authorizer</i> antes de llamar a la Lambda (sílabo 6.7.1).');

/* ───────────── CONCEPTOS CLAVE PARA ESTOS PROBLEMAS ───────────── */
const CONCEPTS = [
  { t:'Subnet pública vs privada y “ningún cómputo accesible desde internet”', h:`
<ul><li>Pon <b>Lambdas (con configuración de VPC), contenedores, instancias y bases de datos en subnets privadas</b>.</li>
<li>En la <b>pública</b> solo van el <b>ALB</b> (si hay) y el <b>NAT Gateway</b>.</li>
<li>API Gateway es un servicio administrado: la app llega a él, no a la Lambda. La Lambda no tiene IP pública.</li>
<li>Para alta disponibilidad, dibuja <b>2 AZ</b> (o indica “subnets privadas en 2 AZ”).</li></ul>` },
  { t:'¿NAT Gateway o VPC Endpoint?', h:`
<ul><li><b>Destino en internet</b> (API de un tercero) → <b>NAT Gateway</b> en la subnet pública + Internet Gateway.</li>
<li><b>Destino en AWS</b> → <b>VPC Endpoint</b>: <b>Gateway</b> para S3 y DynamoDB (gratis); <b>Interface</b> para Secrets Manager, SNS, SQS, Step Functions, KMS y CloudWatch Logs.</li>
<li><b>Destino on-premise</b> → Virtual Private Gateway / Transit Gateway + <b>Direct Connect</b> (principal) o <b>Site-to-Site VPN</b> (respaldo).</li></ul>` },
  { t:'Credenciales fuera del código y de las variables de entorno', h:`
<ul><li>Las API keys y contraseñas van en <b>Secrets Manager</b> (cifradas con KMS, con rotación).</li>
<li>La Lambda las lee al ejecutarse con su <b>rol IAM</b> (<code>secretsmanager:GetSecretValue</code>) a través de un <b>Interface endpoint</b>. Puede guardarlas en memoria entre invocaciones calientes, lo que reduce latencia (ver cold start, LM p.10).</li>
<li>Para hablar con servicios de AWS se usan <b>roles IAM</b>, nunca access keys.</li></ul>` },
  { t:'Autenticación con JWT', h:`
<ul><li>El usuario inicia sesión en <b>Cognito User Pool</b> (o en el proveedor de identidad del banco) y recibe un <b>token JWT con expiración</b>.</li>
<li><b>API Gateway</b> valida el token con un <b>JWT/Cognito authorizer</b> (o una Lambda authorizer) <b>antes</b> de invocar la Lambda. Si es inválido o expiró, responde 401.</li>
<li>Agrega <b>WAF</b> delante para bloquear ataques y limitar solicitudes.</li></ul>` },
  { t:'Patrón Saga (transacciones distribuidas con compensación)', h:`
<ul><li>Cuando una operación toca varios sistemas (tu BD, un tercero, el core), no hay una transacción única. Cada paso tiene una <b>acción de compensación</b> que lo deshace.</li>
<li><b>Saga orquestada con Step Functions</b>: los estados son <i>validar → antifraude → debitar → enviar al core</i>. Si un paso falla (después de sus reintentos), un <code>Catch</code> lleva a la compensación (<i>revertir débito</i>), se marca el estado <code>REVERTIDA</code> y se notifica.</li>
<li>Usa un workflow <b>Standard</b> para operaciones de dinero: guarda el historial de cada ejecución y no repite pasos.</li></ul>` },
  { t:'Idempotencia (que no se procese dos veces)', h:`
<ul><li>El cliente envía un <b>Idempotency-Key</b> (UUID) en la solicitud, o se usa una clave natural (por ejemplo, número de recibo).</li>
<li>La Lambda hace un <code>PutItem</code> en una tabla <b>Idempotencia</b> con <code>ConditionExpression: attribute_not_exists(PK)</code>. Si ya existe, devuelve el resultado guardado y no vuelve a debitar.</li>
<li>El <b>débito</b> también es condicional: <code>UPDATE saldo = saldo - :monto IF saldo &gt;= :monto</code> (una escritura atómica de DynamoDB).</li>
<li>Bonus: el <code>name</code> de la ejecución de Step Functions = transferId. Una ejecución Standard con el mismo nombre no se inicia dos veces.</li>
<li>Pon un <b>TTL</b> en la tabla de idempotencia (por ejemplo, 24 h).</li></ul>` },
  { t:'Manejo de errores y reintentos', h:`
<ul><li>En Step Functions: <code>Retry</code> con <b>backoff exponencial</b> (por ejemplo, 3 intentos, 2 s, ×2) solo para errores transitorios (timeouts, 5xx, throttling). <code>Catch</code> para ir a la compensación.</li>
<li>Pon <b>timeouts</b> cortos en las llamadas a terceros.</li>
<li>Usa colas <b>SQS con DLQ</b> para lo asíncrono (notificaciones, sincronización con el ERP). Lo que falla N veces va a la DLQ, y una <b>alarma de CloudWatch</b> avisa (mismo patrón que SV p.16).</li>
<li>Para el cliente: responde <b>202 Accepted</b> con un transferId, y el estado se consulta con GET o llega por notificación.</li></ul>` },
  { t:'Diseño de tablas DynamoDB (PK/SK)', h:`
<ul><li>Diseña según los <b>patrones de acceso</b>: ¿qué consultas hago?</li>
<li><b>PK</b> (partition key) agrupa los datos de una entidad y <b>SK</b> (sort key) los ordena dentro de ella. Ejemplo: <code>PK = CLIENTE#123</code>, <code>SK = TRF#2026-11-23T10:15#trf-9</code> permite traer “las transferencias del cliente 123 ordenadas por fecha” con un <code>Query</code>.</li>
<li>Se usan prefijos (<code>CLIENTE#</code>, <code>TRF#</code>) para poder guardar varios tipos de item en una tabla (single-table design).</li>
<li>Usa un <b>GSI</b> para otro patrón de acceso (por ejemplo, buscar por transferId o por estado), y <b>TTL</b> para borrar datos temporales.</li></ul>` },
  { t:'Microservicios con contenedores o instancias', h:`
<ul><li>Cada microservicio <b>hace una sola cosa</b> (EV p.14), tiene su propio servicio ECS (o Auto Scaling group de EC2) y escala por separado.</li>
<li>El ALB enruta por ruta (<code>/catalogo</code>, <code>/pedidos</code>). Entre microservicios conviene la comunicación <b>asíncrona</b> con eventos o colas (EV p.15–21), no cadenas síncronas.</li>
<li><b>Alta disponibilidad</b>: tareas o instancias en 2 AZ, RDS Multi-AZ, un NAT por AZ.</li></ul>` },
];

/* ───────────── CASOS TIPO EXAMEN ───────────── */
const XCASES = [
{ id:'banco', kind:'ejemplo', pts:6, title:'Transferencias interbancarias (Serverless)',
  enunciado:'<b>Banco Pacífico Andino</b> desea lanzar transferencias interbancarias inmediatas desde su app móvil. Los clientes se autentican con tokens JWT. Cada transferencia debe validar el saldo del cliente, ser evaluada por un <b>servicio antifraude externo</b> (API de un tercero protegida con API Key), debitar la cuenta y enviar la orden a la <b>CCE</b> a través del <b>core bancario on-premise</b> ubicado en el datacenter del banco en San Isidro, conectado por <b>VPN / Direct Connect</b>. Si la CCE falla o rechaza la operación, el débito debe <b>revertirse</b> (patrón Saga). Al finalizar se debe notificar al cliente por SMS o correo.',
  requisitos:['Ningún componente de cómputo debe ser accesible desde internet.','Las credenciales no pueden estar en el código ni en variables de entorno.','Una misma transferencia no debe debitarse dos veces (idempotencia).','Debe contemplar el manejo de errores y reintentos.'],
  sepide:'El diagrama de arquitectura solución <b>100% AWS</b> indicando VPC, subnets públicas y privadas, VPC Endpoints, NAT Gateway, conexión on-premise y las tablas de DynamoDB con su clave (PK/SK). Servicios mínimos: API Gateway, Lambda, Step Functions, DynamoDB y Secrets Manager.',
  diagram:'x_banco',
  flujo:[
    'La app inicia sesión en <b>Cognito</b> y recibe un <b>JWT</b>.',
    'La app llama a <code>POST /transferencias</code> en <b>API Gateway</b> (con <b>WAF</b>) enviando el JWT y un <code>Idempotency-Key</code>. El <b>authorizer JWT</b> valida el token.',
    '<b>λ iniciarTransferencia</b> (subnet privada) guarda la clave en la tabla <b>Idempotencia</b> con escritura condicional. Si ya existía, devuelve la transferencia original. Si no, crea la transferencia en estado <code>PENDIENTE</code>, inicia <b>Step Functions</b> (nombre de ejecución = transferId) y responde <b>202</b>.',
    '<b>Step Functions (Saga)</b> ejecuta: <i>ValidarSaldo</i> → <i>EvaluarAntifraude</i> → <i>DebitarCuenta</i> → <i>EnviarCCE</i> → <i>Notificar</i>.',
    '<b>λ antifraude</b> lee la API Key desde <b>Secrets Manager</b> (Interface endpoint) y llama al tercero saliendo por el <b>NAT Gateway</b> de la subnet pública y el Internet Gateway.',
    '<b>λ saldo/débito</b> usa DynamoDB por el <b>Gateway endpoint</b>: un débito <b>condicional</b> (<code>saldo &gt;= monto</code>) y un registro del movimiento.',
    '<b>λ enviarCCE</b> lee las credenciales del core en Secrets Manager y llama al <b>core bancario on-premise</b> por el <b>Virtual Private Gateway</b> y <b>Direct Connect</b> (con VPN de respaldo). El core envía la orden a la <b>CCE</b>.',
    'Si la CCE falla o rechaza (después de los reintentos), el <code>Catch</code> ejecuta <b>RevertirDébito</b> (compensación) y deja la transferencia en estado <code>REVERTIDA</code>.',
    '<b>λ notificar</b> publica en <b>SNS</b> (Interface endpoint): SMS o correo al cliente con el resultado.',
  ],
  tabla:[
    ['Ningún cómputo accesible desde internet','Todas las Lambdas están en <b>subnets privadas</b> (2 AZ), sin IP pública. Solo API Gateway (administrado, con WAF y JWT) recibe tráfico. La salida a internet es solo por <b>NAT</b>, y el acceso a AWS por <b>VPC Endpoints</b>.'],
    ['Credenciales fuera del código y de las variables de entorno','La <b>API Key del antifraude</b> y las <b>credenciales del core</b> están en <b>Secrets Manager</b> (cifradas con KMS). Se leen en tiempo de ejecución con el <b>rol IAM</b> de cada Lambda.'],
    ['Idempotencia','Tabla <b>Idempotencia</b> con <code>attribute_not_exists(PK)</code>, ejecución de Step Functions con nombre = transferId y débito condicional.'],
    ['Errores y reintentos','<code>Retry</code> con backoff exponencial en antifraude y CCE (3 intentos), <code>Catch</code> → compensación (revertir débito), timeouts, alarmas de CloudWatch sobre ejecuciones fallidas y DLQ en las notificaciones.'],
  ],
  ddb:[
    { tabla:'Transferencias', pk:'CLIENTE#&lt;clienteId&gt;', sk:'TRF#&lt;fechaISO&gt;#&lt;transferId&gt;', attrs:'monto, cuentaDestino, bancoDestino, estado (PENDIENTE · DEBITADA · ENVIADA · COMPLETADA · REVERTIDA), executionArn', uso:'Historial del cliente ordenado por fecha (Query por PK). GSI por transferId para consultar el estado.' },
    { tabla:'Cuentas', pk:'CUENTA#&lt;nroCuenta&gt;', sk:'SALDO  ·  MOV#&lt;fechaISO&gt;#&lt;transferId&gt;', attrs:'saldo (item SALDO), tipo DEBITO/REVERSO y monto (items MOV#)', uso:'Débito condicional sobre el item SALDO y movimientos para auditoría y reverso.' },
    { tabla:'Idempotencia', pk:'IDEMP#&lt;idempotencyKey&gt;', sk:'— (solo PK)', attrs:'transferId, respuesta, ttl (24 h)', uso:'<code>PutItem</code> condicional: si ya existe, no se procesa de nuevo.' },
  ],
  notas:['<span class="tag warn">fuera de las diapositivas</span> VPC, NAT, endpoints, Direct Connect, Secrets Manager, Saga e idempotencia no están en <code>Clases/</code>. Sí lo están Lambda, API Gateway, Step Functions, DynamoDB y SNS (SV p.11–13, EV p.12–22).','Las dos AZ no están dibujadas para no recargar el diagrama. En el examen escribe “subnets privadas y públicas en 2 AZ, un NAT por AZ”.','Si tu enunciado dice que el saldo vive en el core, la validación y el débito se hacen llamando al core (por DX) y la tabla Cuentas desaparece. Es una decisión de diseño que debes explicar.'],
  req:['apigw','lambda','stepfunctions','dynamodb','secrets','nat','vpce','dx','sns','cognito'],
},
{ id:'tienda-ms', kind:'ejemplo', pts:5, title:'Microservicios con contenedores e instancias',
  enunciado:'<b>Mercado Andino</b> migra su tienda online monolítica a <b>microservicios</b>: catálogo, pedidos y pagos. La web es una SPA. En campañas (Cyber Days) el tráfico se multiplica por 10. Pagos llama a una <b>pasarela de pagos externa</b>. Cuando se crea un pedido, inventario debe actualizarse y el cliente debe recibir un correo, <b>sin que el cliente espere</b>.',
  requisitos:['Alta disponibilidad: debe seguir funcionando si cae una zona de disponibilidad.','Los contenedores y la base de datos no deben ser accesibles desde internet.','Cada microservicio debe escalar de forma independiente.','La contraseña de la base de datos no debe estar en el código.'],
  sepide:'El diagrama de arquitectura con VPC, subnets públicas y privadas en 2 AZ, balanceador de carga, los microservicios en contenedores con Auto Scaling, la base de datos y la comunicación asíncrona entre servicios.',
  diagram:'x_tienda',
  flujo:[
    'El cliente carga la SPA desde <b>CloudFront + S3</b>.',
    'Las llamadas <code>/api/*</code> llegan al <b>Application Load Balancer</b> (subnets públicas en 2 AZ), que enruta por ruta a cada <b>servicio ECS Fargate</b> (subnets privadas en 2 AZ).',
    'Cada microservicio tiene <b>Service Auto Scaling</b> (por ejemplo, de 2 a 20 tareas según CPU o solicitudes) y escala por separado.',
    '<b>Catálogo</b> lee de <b>ElastiCache</b> (caché) y de <b>Aurora</b>. <b>Pedidos</b> escribe en <b>Aurora Multi-AZ</b>, con la contraseña en <b>Secrets Manager</b>.',
    '<b>Pagos</b> llama a la pasarela externa saliendo por el <b>NAT Gateway</b> (uno por AZ).',
    'Pedidos publica <code>PedidoCreado</code> en <b>EventBridge</b> (EV p.18–19). Una regla lo envía a una <b>cola SQS</b> que consume el worker de <b>inventario</b>, y otra a una <b>Lambda</b> que envía el correo con <b>SES</b>. El cliente no espera.',
    '<b>CloudWatch</b> mide CPU, latencia y errores, y sus alarmas disparan el escalado (MO p.10–12).',
  ],
  tabla:[
    ['Alta disponibilidad','ALB, tareas ECS y NAT en <b>2 AZ</b>, y <b>Aurora Multi-AZ</b> con failover automático.'],
    ['No accesible desde internet','Contenedores y base de datos en <b>subnets privadas</b>. Solo el ALB es público y acepta solo 443. Los security groups permiten tráfico ALB → tareas → BD.'],
    ['Escalar de forma independiente','Un <b>servicio ECS</b> por microservicio, cada uno con su propio Auto Scaling. Inventario se desacopla con SQS.'],
    ['Contraseña fuera del código','<b>Secrets Manager</b>, inyectado en la tarea con el rol IAM de ECS.'],
  ],
  ddb:[],
  notas:['<span class="tag warn">fuera de las diapositivas</span> ALB, ECS, NAT, Aurora Multi-AZ, ElastiCache y CloudFront no están en <code>Clases/</code>. Monolito vs microservicios y el fan out con EventBridge sí lo están (EV p.14–19).','<b>Con instancias</b> en lugar de contenedores, cambia cada servicio ECS por un <b>Auto Scaling group de EC2</b> (AMI con el microservicio) detrás del mismo ALB. Ganas control del sistema operativo, pero administras parches y capacidad.','Si te piden serverless, cambia ECS por API Gateway + Lambda: el resto del diseño no cambia.'],
  req:['alb','ecs','rds','nat','eventbridge','sqs','secrets','cloudwatch'],
},
{ id:'clinica-lab', kind:'ejemplo', pts:5, title:'Resultados de laboratorio con sistema on-premise',
  enunciado:'La <b>Clínica San Gabriel</b> quiere que sus pacientes vean sus resultados de laboratorio (PDF) desde una app. Los resultados los genera el <b>sistema de laboratorio (LIS) on-premise</b>, en el datacenter de la clínica. Cuando hay un resultado nuevo, el paciente debe recibir una notificación.',
  requisitos:['Los PDF son datos de salud: cifrados en reposo y en tránsito (Ley de Protección de Datos Personales).','El paciente solo puede ver sus propios resultados, mediante enlaces que expiren en 15 minutos.','El LIS no debe enviar datos por internet público.','Debe quedar auditoría de quién accedió a cada resultado.'],
  sepide:'El diagrama con la conexión on-premise, VPC y subnets, endpoints, almacenamiento cifrado, autenticación y la tabla de DynamoDB con su PK/SK.',
  diagram:'x_clinica',
  flujo:[
    'El <b>LIS</b> sube cada PDF a <b>S3</b> por la <b>VPN Site-to-Site</b> y un <b>Interface endpoint de S3</b>: nunca pasa por internet público.',
    'S3 cifra con <b>SSE-KMS</b>. El evento “objeto creado” va a <b>EventBridge</b>, que dispara <b>λ registrarResultado</b> (SV p.16, p.19).',
    'La Lambda (subnet privada) guarda los metadatos en <b>DynamoDB</b> (Gateway endpoint) y publica en <b>SNS</b>: aviso al paciente.',
    'El paciente inicia sesión con <b>Cognito</b> (JWT) y llama a <code>GET /resultados</code> en <b>API Gateway</b>.',
    '<b>λ obtenerResultado</b> verifica que el resultado sea del paciente (PK = su id) y genera una <b>URL prefirmada de S3 que expira en 15 min</b>.',
    'La app descarga el PDF directo de S3 con esa URL (HTTPS). <b>CloudTrail</b> (data events de S3) registra cada acceso.',
  ],
  tabla:[
    ['Datos de salud cifrados','S3 y DynamoDB con <b>KMS</b>, todo el tránsito por <b>HTTPS</b> y la VPN es IPsec.'],
    ['Solo sus resultados, enlace de 15 min','JWT de Cognito → la Lambda consulta <code>PK = PACIENTE#&lt;sub del token&gt;</code> → <b>URL prefirmada</b> con expiración de 900 s.'],
    ['El LIS sin internet público','<b>Site-to-Site VPN</b> (o Direct Connect) + <b>Interface endpoint de S3</b>.'],
    ['Auditoría','<b>CloudTrail</b> con data events de S3 y logs de la Lambda en CloudWatch.'],
  ],
  ddb:[{ tabla:'Resultados', pk:'PACIENTE#&lt;pacienteId&gt;', sk:'RES#&lt;fechaISO&gt;#&lt;ordenId&gt;', attrs:'examen, s3Key, estado (NUEVO · VISTO), medico', uso:'Lista de resultados del paciente ordenada por fecha (Query por PK).' }],
  notas:['<span class="tag warn">fuera de las diapositivas</span> VPN, endpoints, KMS, URLs prefirmadas y CloudTrail no están en <code>Clases/</code>. S3 → evento → Lambda y SNS sí lo están (SV p.16, p.19, EV p.22).','Es similar al proyecto de clínicas: puedes combinar ambos diseños.'],
  req:['vpn','vpce','s3','kms','lambda','dynamodb','apigw','cognito','sns','cloudtrail'],
},
{ id:'billetera', kind:'practica', pts:6, title:'Pago de recibos desde una billetera digital',
  enunciado:'La fintech <b>Yapu</b> permite pagar recibos de agua y luz desde su billetera digital. El usuario autenticado (JWT) consulta su deuda y paga. El pago debe <b>reservar el saldo</b> de la billetera, llamar a la <b>API de recaudación de la empresa de servicios</b> (tercero, protegida con API Key), <b>confirmar</b> el pago o <b>liberar el saldo</b> si la recaudación falla, generar un <b>comprobante PDF</b> y notificar al usuario por correo.',
  requisitos:['Ningún componente de cómputo accesible desde internet.','La API Key del tercero no puede estar en el código ni en variables de entorno.','Un mismo recibo no puede pagarse dos veces, aunque el usuario presione “Pagar” dos veces.','Si la recaudación no responde, reintentar 3 veces con backoff y luego liberar el saldo.','El usuario debe poder ver su historial de pagos ordenado por fecha.'],
  sepide:'El diagrama de arquitectura 100% AWS con VPC, subnets públicas y privadas, VPC Endpoints, NAT Gateway y las tablas de DynamoDB con su PK/SK. Servicios mínimos: API Gateway, Lambda, Step Functions, DynamoDB, S3 y Secrets Manager.',
  pistas:['Es casi el mismo esquema que el ejemplo del banco, pero sin on-premise.','La clave natural de idempotencia es el recibo (empresa + número).','“Reservar y luego confirmar o liberar” es una Saga de dos fases.','¿Dónde guardas el PDF y cómo llega el usuario a él?','¿Qué tabla responde “mis pagos ordenados por fecha”?'],
  diagram:'x_billetera',
  flujo:['La app (JWT de Cognito) → <b>API Gateway</b> (authorizer JWT) → <b>λ iniciarPago</b> (subnet privada).','Idempotencia: <code>PutItem</code> condicional con <code>PK = RECIBO#&lt;empresa&gt;#&lt;nro&gt;</code>. Si existe, devuelve el pago original.','<b>Step Functions</b>: ReservarSaldo (débito condicional) → Recaudar (λ por <b>NAT</b>, API Key en <b>Secrets Manager</b>, <code>Retry</code> 3 veces con backoff) → ConfirmarPago, o <code>Catch</code> → <b>LiberarSaldo</b>.','λ comprobante genera el PDF en <b>S3</b> (Gateway endpoint), y <b>SES/SNS</b> envía el correo con una URL prefirmada.','El historial se obtiene con <code>Query PK = USER#id</code> en la tabla Pagos.'],
  tabla:[['Sin cómputo público','Lambdas en subnets privadas, NAT solo para la recaudación y endpoints para DynamoDB, S3, Secrets Manager y SNS.'],['API Key segura','Secrets Manager + rol IAM.'],['No pagar dos veces','Tabla Idempotencia por recibo + reserva condicional del saldo.'],['Reintentos','<code>Retry</code> (3, backoff ×2) en Recaudar y <code>Catch</code> → LiberarSaldo.'],['Historial','Tabla Pagos con SK por fecha.']],
  ddb:[{ tabla:'Billeteras', pk:'USER#&lt;userId&gt;', sk:'SALDO', attrs:'saldoDisponible, saldoReservado', uso:'Reserva y liberación con escrituras condicionales.' },{ tabla:'Pagos', pk:'USER#&lt;userId&gt;', sk:'PAGO#&lt;fechaISO&gt;#&lt;pagoId&gt;', attrs:'empresa, nroRecibo, monto, estado, s3KeyComprobante', uso:'Historial ordenado por fecha.' },{ tabla:'Idempotencia', pk:'RECIBO#&lt;empresa&gt;#&lt;nroRecibo&gt;', sk:'—', attrs:'pagoId, estado, ttl', uso:'Evita el doble pago del mismo recibo.' }],
  notas:['<span class="tag warn">fuera de las diapositivas</span> Igual que en el ejemplo del banco.'],
  req:['apigw','lambda','stepfunctions','dynamodb','s3','secrets','nat','vpce','cognito'],
},
{ id:'matricula', kind:'practica', pts:5, title:'Matrícula masiva con microservicios',
  enunciado:'Una universidad con <b>3 sedes</b> abre la matrícula a las 8:00 y unos <b>20 000 alumnos</b> entran en 10 minutos. El sistema tiene los microservicios <b>cursos/horarios</b>, <b>matrícula</b> y <b>pagos</b>. Las secciones y sus vacantes están en una base de datos <b>relacional</b>. El alumno debe ver si su matrícula está “en proceso” o “confirmada” y recibir un correo de confirmación.',
  requisitos:['Alta disponibilidad en 2 zonas de disponibilidad.','No se puede vender más vacantes de las que hay.','Ninguna solicitud se puede perder durante el pico.','Los contenedores y la base de datos no deben ser accesibles desde internet.','El sistema es multi-tenant: una sede no puede ver los datos de otra.'],
  sepide:'El diagrama con VPC, subnets públicas y privadas en 2 AZ, balanceador, microservicios en contenedores con Auto Scaling, cola para el pico, base de datos y el patrón multi-tenant elegido.',
  pistas:['El pico se absorbe con una cola entre “recibir la solicitud” y “procesarla” (EV p.15).','No sobrevender: actualización condicional en la BD relacional.','El alumno ve “en proceso” porque se responde 202 y el estado se guarda aparte.','¿Patrón 1, 2 o 3 de multi-tenancy? Justifícalo (MT p.12–14).'],
  diagram:'x_matricula',
  flujo:['La SPA se carga desde <b>CloudFront + S3</b>. El login es con <b>Cognito</b>.','El <b>ALB</b> (subnets públicas en 2 AZ) envía <code>/cursos</code> y <code>/matricula</code> a sus <b>servicios ECS Fargate</b> (subnets privadas en 2 AZ, con Auto Scaling).','<b>Matrícula</b> valida la solicitud, la envía a una <b>cola SQS</b> (con DLQ), guarda el estado <code>EN_PROCESO</code> y responde <b>202</b>.','El <b>worker de matrícula</b> (ECS, escala según el tamaño de la cola) ejecuta en <b>Aurora Multi-AZ</b>: <code>UPDATE secciones SET vacantes = vacantes - 1 WHERE id = ? AND tenant_id = ? AND vacantes &gt; 0</code>. Si actualiza una fila, pasa a <code>CONFIRMADA</code>; si no, a <code>SIN_VACANTE</code>.','Publica <code>MatriculaConfirmada</code> en <b>EventBridge</b> → λ correo (<b>SES</b>) y servicio de pagos.','<b>Multi-tenant</b>: Patrón 1, columna <code>TENANT_ID = sede</code> en todas las tablas y en cada consulta (MT p.12).'],
  tabla:[['Alta disponibilidad','ALB, ECS y NAT en 2 AZ, y Aurora Multi-AZ.'],['Sin sobreventa','UPDATE condicional atómico en Aurora.'],['No perder solicitudes','Cola SQS con DLQ y worker que escala con la cola.'],['Nada expuesto','ECS y Aurora en subnets privadas, solo el ALB es público.'],['Multi-tenant','TENANT_ID por sede (Patrón 1), o Patrón 3 si piden máximo aislamiento.']],
  ddb:[{ tabla:'EstadoMatricula (opcional)', pk:'ALUMNO#&lt;alumnoId&gt;', sk:'PERIODO#2026-2', attrs:'estado, secciones[], tenantId', uso:'El alumno consulta su estado sin cargar Aurora.' }],
  notas:['<span class="tag warn">fuera de las diapositivas</span> ALB, ECS y Aurora no están en <code>Clases/</code>. La cola para desacoplar (EV p.15), el fan out (EV p.18) y multi-tenancy (MT p.12–14) sí lo están.'],
  req:['alb','ecs','sqs','rds','eventbridge','nat','cognito'],
},
{ id:'frio', kind:'practica', pts:6, title:'Cadena de frío con ERP on-premise',
  enunciado:'<b>FarmaTrans</b> transporta vacunas. Cada camión tiene sensores que envían la temperatura cada 10 s por <b>MQTT</b>. Si la temperatura supera los 8 °C durante 5 minutos, se debe alertar al conductor (SMS) y a la central de monitoreo. Cada alerta y cada entrega deben registrarse en el <b>ERP (SAP) on-premise</b> del datacenter de la empresa, conectado por <b>Direct Connect</b>.',
  requisitos:['Cada sensor se autentica de forma individual.','Ningún componente de cómputo accesible desde internet.','Las credenciales del ERP no pueden estar en el código.','No se debe enviar la misma alerta dos veces para la misma ventana de 5 minutos.','Si el ERP no responde, reintentar sin perder el mensaje.','Consultar las lecturas de un camión en un rango de fechas.'],
  sepide:'El diagrama 100% AWS con VPC, subnets, VPC Endpoints, conexión on-premise y las tablas de DynamoDB con su PK/SK.',
  pistas:['MQTT + identidad por dispositivo = IoT Core con certificados.','Streaming en tiempo real = Kinesis → Lambda (SV p.20, p.22).','Una alerta por ventana = escritura condicional (idempotencia).','“Reintentar sin perder” hacia el ERP = cola SQS + DLQ.','Rango de fechas = SK con la fecha.'],
  diagram:'x_frio',
  flujo:['Los sensores se conectan a <b>IoT Core</b> con <b>certificados X.509</b>. Una regla envía las lecturas a <b>Kinesis</b>.','Kinesis dispara <b>λ procesarLectura</b> (subnet privada), que guarda la lectura en DynamoDB (Gateway endpoint) y evalúa los últimos 5 minutos.','Si se supera el umbral: <code>PutItem</code> condicional en <b>Alertas</b> (<code>PK = CAMION#id</code>, <code>SK = ALERTA#ventana</code>). Solo si no existía, publica en <b>SNS</b> (SMS al conductor y correo a la central).','La alerta se envía a una <b>cola SQS</b> (con DLQ) → <b>λ syncERP</b> lee las credenciales en <b>Secrets Manager</b> y llama al <b>SAP on-premise</b> por el Virtual Private Gateway y <b>Direct Connect</b>. Si falla, el mensaje vuelve a la cola y se reintenta.','<b>CloudWatch</b>: alarma si la DLQ tiene mensajes (SV p.16).'],
  tabla:[['Identidad por sensor','IoT Core con un certificado X.509 por dispositivo.'],['Sin cómputo público','Lambdas en subnets privadas y endpoints para DynamoDB, SNS, SQS y Secrets Manager.'],['Credenciales ERP','Secrets Manager.'],['Alerta única por ventana','Escritura condicional en Alertas.'],['Reintentos','SQS con reintentos + DLQ + alarma.'],['Rango de fechas','Lecturas con <code>SK = TS#&lt;fechaISO&gt;</code> → Query con <code>BETWEEN</code>.']],
  ddb:[{ tabla:'Lecturas', pk:'CAMION#&lt;camionId&gt;', sk:'TS#&lt;fechaISO&gt;', attrs:'temp, lat, lon, presion, ttl', uso:'Lecturas de un camión entre dos fechas (Query con BETWEEN).' },{ tabla:'Alertas', pk:'CAMION#&lt;camionId&gt;', sk:'ALERTA#&lt;inicioVentana&gt;', attrs:'tempMax, estado, enviadoERP', uso:'Una sola alerta por ventana (escritura condicional).' }],
  notas:['<span class="tag warn">fuera de las diapositivas</span> IoT Core, VPC, Direct Connect y Secrets Manager no están en <code>Clases/</code>. Kinesis → Lambda → DynamoDB y SNS sí lo están (SV p.20–22, EV p.20).'],
  req:['iotcore','kinesis','lambda','dynamodb','sns','sqs','secrets','dx','vpce'],
},
];

/* ───────────── DIAGRAMAS DE SOLUCIÓN ─────────────
   grupos: [etiqueta, c1, r1, c2, r2, tipo]  tipo: cloud | vpc | pub | priv | onprem */
Object.assign(DIAGRAMS, {
  x_banco: { cw: 205, nodes: [
      ['app','App móvil','cliente',0,3], ['cog','Cognito','seguridad',1,1.6,'emite JWT'], ['api','API Gateway + WAF','integracion',1,3,'authorizer JWT'],
      ['sfn','Step Functions','integracion',1,4.1,'Saga · Retry/Catch'], ['cw','CloudWatch','monitoreo',1,6.8,'alarmas · logs'],
      ['li','λ iniciarTransferencia','computo',2,3,'idempotencia · 202'], ['lv','λ saldo / débito / reverso','computo',2,5.4],
      ['lf','λ antifraude','computo',3,1.6], ['lc','λ enviar CCE','computo',3,4.6], ['ln','λ notificar','computo',3,6.8],
      ['nat','NAT Gateway','red',4,0.3], ['e1','VPC Endpoint (Gateway)','red',4,2.4,'DynamoDB'], ['e2','VPC Endpoint (Interface)','red',4,3.6,'Secrets Manager'],
      ['vgw','Virtual Private Gateway','red',4,5.2], ['e3','VPC Endpoint (Interface)','red',4,6.8,'SNS'],
      ['igw','Internet Gateway','red',5,0.3], ['ddb','DynamoDB','datos',5,2.4,'Transferencias · Cuentas · Idempotencia'], ['sm','Secrets Manager','seguridad',5,3.6,'API Key · credenciales core'],
      ['dx','Direct Connect','red',5,5.2,'+ VPN de respaldo'], ['sns','Amazon SNS','integracion',5,6.8,'SMS / correo'],
      ['fr','API antifraude (tercero)','cliente',6,0.3], ['core','Core bancario','cliente',6,5.2,'San Isidro'], ['cce','CCE','cliente',6,6.4], ['cli','Cliente (SMS / correo)','cliente',6,7.6] ],
    edges: [['app','cog','login'],['app','api','POST + JWT'],['api','li'],['li','sfn','StartExecution'],['li','e1'],
      ['sfn','lv'],['sfn','lf'],['sfn','lc'],['sfn','ln'],['lv','e1'],['lf','nat'],['nat','igw'],['igw','fr','HTTPS + API Key'],['lf','e2','API Key'],['lc','e2'],
      ['lc','vgw'],['vgw','dx'],['dx','core'],['core','cce','orden'],['ln','e3'],['e1','ddb'],['e2','sm'],['e3','sns'],['sns','cli']],
    groups: [['AWS Cloud · us-east-1',1,0.3,5,7.0,'cloud'],['VPC',2,0.3,4,7.0,'vpc'],['Subnet pública (2 AZ)',4,0.3,4,0.3,'pub'],['Subnets privadas (2 AZ)',2,1.6,3,6.8,'priv'],['Datacenter on-premise',6,5.2,6,6.4,'onprem']] },
  x_tienda: { cw: 205, nodes: [
      ['cli','Cliente web','cliente',0,2.4], ['cf','CloudFront + S3','web',1,0.8,'SPA'], ['pas','Pasarela de pagos (tercero)','cliente',0,4.6],
      ['igw','Internet Gateway','red',1,4.6], ['alb','Application Load Balancer','red',2,2.4,'/catalogo /pedidos /pagos'], ['nat','NAT Gateway','red',2,4.6],
      ['cat','ECS Fargate: catálogo','computo',3,1.2,'Auto Scaling 2–20'], ['ped','ECS Fargate: pedidos','computo',3,2.4,'Auto Scaling 2–20'], ['pag','ECS Fargate: pagos','computo',3,4.6,'Auto Scaling 2–10'],
      ['red','ElastiCache','datos',4,0.6,'caché catálogo'], ['db','Aurora Multi-AZ','datos',4,2.4,'pedidos · productos'],
      ['sm','Secrets Manager','seguridad',5,1.2], ['eb','EventBridge','integracion',5,3.5,'PedidoCreado'], ['cw','CloudWatch','monitoreo',5,5.0,'métricas → escalado'],
      ['q','SQS inventario','integracion',6,3.0], ['lm','λ correo (SES)','computo',6,4.1], ['inv','Worker inventario','computo',7,3.0], ['c2','Cliente (correo)','cliente',7,4.1] ],
    edges: [['cli','cf'],['cli','alb','/api/*'],['alb','cat'],['alb','ped'],['alb','pag'],['cat','red'],['cat','db'],['ped','db'],['ped','eb','evento'],
      ['pag','nat'],['nat','igw'],['igw','pas'],['db','sm','',{dash:true}],['eb','q'],['eb','lm'],['q','inv'],['lm','c2']],
    groups: [['AWS Cloud',1,0.6,7,5.0,'cloud'],['VPC',2,0.6,4,4.6,'vpc'],['Subnets públicas (2 AZ)',2,2.4,2,4.6,'pub'],['Subnets privadas app (2 AZ)',3,1.2,3,4.6,'priv'],['Subnets privadas datos',4,0.6,4,2.4,'priv']] },
  x_clinica: { cw: 205, nodes: [
      ['lis','Sistema de laboratorio (LIS)','cliente',0,0.6], ['vpn','Site-to-Site VPN','red',1,0.6,'IPsec'],
      ['e0','VPC Endpoint (Interface)','red',2,0.6,'S3'], ['s3','S3 resultados','datos',4,0.6,'SSE-KMS'], ['kms','AWS KMS','seguridad',5,0.6],
      ['eb','EventBridge','integracion',5,1.8,'objeto creado'], ['lr','λ registrarResultado','computo',3,1.8],
      ['e1','VPC Endpoint (Gateway)','red',4,3.6,'DynamoDB'], ['ddb','DynamoDB Resultados','datos',5,3.6,'PK PACIENTE# · SK RES#'],
      ['sns','Amazon SNS','integracion',4,2.6,'aviso al paciente'],
      ['pac','Paciente (app)','cliente',0,3.6], ['cog','Cognito','seguridad',1,2.6,'JWT'], ['api','API Gateway','integracion',1,3.6,'authorizer JWT'],
      ['lg','λ obtenerResultado','computo',3,3.6,'URL prefirmada 15 min'], ['ct','CloudTrail','monitoreo',5,4.7,'auditoría de accesos'] ],
    edges: [['lis','vpn'],['vpn','e0'],['e0','s3','PUT PDF'],['s3','kms','',{dash:true}],['s3','eb'],['eb','lr'],['lr','e1'],['e1','ddb'],['lr','sns'],
      ['pac','cog','login'],['pac','api','GET /resultados'],['api','lg'],['lg','e1']],
    groups: [['Datacenter clínica',0,0.6,0,0.6,'onprem'],['AWS Cloud',1,0.4,5,4.7,'cloud'],['VPC',2,0.6,3,3.6,'vpc'],['Subnets privadas (2 AZ)',3,1.8,3,3.6,'priv']] },
  x_billetera: { cw: 205, nodes: [
      ['app','App Yapu','cliente',0,2.6], ['cog','Cognito','seguridad',1,1.4,'JWT'], ['api','API Gateway + WAF','integracion',1,2.6],
      ['sfn','Step Functions','integracion',1,4.4,'Reservar → Recaudar → Confirmar / Liberar'],
      ['li','λ iniciarPago','computo',2,2.6,'idempotencia por recibo'], ['ls','λ reservar / confirmar / liberar','computo',2,4.4],
      ['lr','λ recaudar','computo',3,1.4,'Retry 3 · backoff'], ['lp','λ comprobante PDF','computo',3,4.4],
      ['nat','NAT Gateway','red',4,0.2], ['e1','VPC Endpoint (Gateway)','red',4,2.6,'DynamoDB · S3'], ['e2','VPC Endpoint (Interface)','red',4,3.8,'Secrets Manager · SNS'],
      ['igw','Internet Gateway','red',5,0.2], ['ddb','DynamoDB','datos',5,2.0,'Billeteras · Pagos · Idempotencia'], ['s3','S3 comprobantes','datos',5,3.0],
      ['sm','Secrets Manager','seguridad',5,4.0,'API Key'], ['sns','SNS / SES','integracion',5,5.0,'correo'],
      ['rec','API de recaudación (tercero)','cliente',6,0.2], ['u','Usuario (correo)','cliente',6,5.0] ],
    edges: [['app','cog'],['app','api','POST /pagos'],['api','li'],['li','sfn'],['li','e1'],['sfn','ls'],['sfn','lr'],['sfn','lp'],['ls','e1'],['lp','e1'],['lr','nat'],['nat','igw'],['igw','rec'],['lr','e2'],['lp','e2'],
      ['e1','ddb'],['e1','s3'],['e2','sm'],['e2','sns'],['sns','u']],
    groups: [['AWS Cloud',1,0.2,5,5.0,'cloud'],['VPC',2,0.2,4,4.4,'vpc'],['Subnet pública',4,0.2,4,0.2,'pub'],['Subnets privadas (2 AZ)',2,1.4,3,4.4,'priv']] },
  x_matricula: { cw: 205, nodes: [
      ['al','Alumno (web)','cliente',0,2.4], ['cf','CloudFront + S3','web',1,0.8], ['cog','Cognito','seguridad',1,3.8],
      ['alb','Application Load Balancer','red',2,2.4], ['nat','NAT Gateway','red',2,4.4],
      ['cur','ECS: cursos','computo',3,1.2,'Auto Scaling'], ['mat','ECS: matrícula','computo',3,2.4,'responde 202'], ['wk','ECS: worker matrícula','computo',3,4.4,'escala con la cola'],
      ['q','SQS (+ DLQ)','integracion',4,3.4], ['db','Aurora Multi-AZ','datos',4,1.2,'TENANT_ID · vacantes'], ['st','DynamoDB EstadoMatricula','datos',4,2.2],
      ['eb','EventBridge','integracion',5,5.6,'MatriculaConfirmada'], ['ses','λ correo (SES)','computo',6,5.1], ['pg','Servicio pagos','computo',6,6.1] ],
    edges: [['al','cf'],['al','alb'],['al','cog'],['alb','cur'],['alb','mat'],['cur','db'],['mat','st','EN_PROCESO'],['mat','q','encola'],['q','wk'],['wk','db','vacantes > 0'],['wk','eb'],['eb','ses'],['eb','pg']],
    groups: [['AWS Cloud',1,0.8,6,6.1,'cloud'],['VPC',2,1.2,4,4.4,'vpc'],['Subnets públicas (2 AZ)',2,2.4,2,4.4,'pub'],['Subnets privadas (2 AZ)',3,1.2,4,4.4,'priv']] },
  x_frio: { cw: 205, nodes: [
      ['sen','Sensores (MQTT)','cliente',0,1.6,'certificado X.509'], ['iot','AWS IoT Core','integracion',1,1.6,'regla → Kinesis'], ['kin','Amazon Kinesis','integracion',1,3.0],
      ['lp','λ procesarLectura','computo',2,3.0,'umbral 5 min'], ['ls','λ syncERP','computo',2,5.2],
      ['e1','VPC Endpoint (Gateway)','red',3,1.6,'DynamoDB'], ['e2','VPC Endpoint (Interface)','red',3,3.0,'SNS · SQS · Secrets'], ['vgw','Virtual Private Gateway','red',3,4.4],
      ['ddb','DynamoDB','datos',4,1.6,'Lecturas · Alertas'], ['sns','Amazon SNS','integracion',4,2.3,'SMS conductor · central'], ['q','SQS (+ DLQ)','integracion',4,3.7,'alertas → ERP'],
      ['sm','Secrets Manager','seguridad',5,3.0,'credenciales ERP'], ['cw','CloudWatch','monitoreo',5,1.6,'alarma DLQ'], ['dx','Direct Connect','red',5,4.4], ['erp','ERP SAP','cliente',6,4.4] ],
    edges: [['sen','iot'],['iot','kin'],['kin','lp','dispara'],['lp','e1'],['lp','e2'],['e1','ddb'],['e2','sns','alerta única'],['e2','q'],['q','ls'],['ls','e2'],['ls','vgw'],['vgw','dx'],['dx','erp'],['e2','sm']],
    groups: [['AWS Cloud',1,1.6,5,5.2,'cloud'],['VPC',2,1.6,3,5.2,'vpc'],['Subnets privadas (2 AZ)',2,3.0,2,5.2,'priv'],['Datacenter',6,4.4,6,4.4,'onprem']] },
});

/* ───────────── CORRECCIÓN EN EL EDITOR ─────────────
   inside: qué tipos de nodo deben quedar dentro de qué zona (por posición en el lienzo) */
const COMPUTE = ['lambda','ecs','ec2','fargate','eks'];
Object.assign(GRADING, {
  banco: { conn: [
    { f:['actor'], t:['apigw'], why:'La app entra por API Gateway (no a la Lambda).', src:'SV p.23' },
    { f:['actor','apigw'], t:['cognito'], why:'Autenticación con JWT (Cognito User Pool o authorizer).', src:'fuera de las diapositivas' },
    { f:['apigw'], t:['lambda'], why:'API Gateway invoca la Lambda que inicia la transferencia.', src:'SV p.15' },
    { f:['lambda'], t:['stepfunctions'], why:'La Lambda inicia la Saga en Step Functions.', src:'SV p.12, p.17' },
    { f:['stepfunctions'], t:['lambda'], min:3, why:'Step Functions orquesta los pasos: saldo/débito, antifraude, envío a la CCE, notificación.', src:'SV p.17' },
    { f:['lambda','vpce'], t:['dynamodb'], why:'Idempotencia, transferencias y saldo en DynamoDB (vía Gateway endpoint).', src:'SV p.13' },
    { f:['lambda','vpce'], t:['secrets'], why:'La API Key y las credenciales del core se leen de Secrets Manager.', src:'fuera de las diapositivas' },
    { f:['lambda'], t:['vpce'], why:'Las Lambdas privadas llegan a los servicios de AWS por VPC Endpoints.', src:'fuera de las diapositivas' },
    { f:['lambda'], t:['nat'], why:'El antifraude externo está en internet: salida por NAT Gateway.', src:'fuera de las diapositivas' },
    { f:['nat','igw'], t:['actor','igw'], why:'NAT → Internet Gateway → API del tercero.', src:'fuera de las diapositivas' },
    { f:['lambda','vpn','dx'], t:['dx','vpn','actor'], why:'Conexión con el core on-premise por Direct Connect o VPN.', src:'fuera de las diapositivas' },
    { f:['lambda','vpce'], t:['sns','ses'], why:'Notificación por SMS o correo.', src:'EV p.22' },
  ], text: [
    { re:/PK/i, why:'Indica la PK de las tablas DynamoDB (en la etiqueta del nodo o en una flecha).', src:'Se pide' },
    { re:/SK/i, why:'Indica la SK de las tablas DynamoDB.', src:'Se pide' },
    { re:/idempot/i, why:'Indica dónde se resuelve la idempotencia.', src:'Requisito' },
    { re:/revert|compens|saga|catch/i, why:'Indica la compensación (revertir débito) de la Saga.', src:'Enunciado' },
  ], inside: [
    { types:COMPUTE, kind:'priv', why:'Todo el cómputo en subnets privadas: “ningún componente de cómputo accesible desde internet”.' },
    { types:['nat'], kind:'pub', why:'El NAT Gateway va en una subnet pública.' },
    { types:['vpce'], kind:'vpc', why:'Los VPC Endpoints están dentro de la VPC.' },
    { types:['actor'], kind:'onprem', label:/core|cce/i, why:'El core bancario (y la CCE) van en el datacenter on-premise.' },
  ]},
  'tienda-ms': { conn: [
    { f:['actor','cloudfront'], t:['alb'], why:'El tráfico de la API entra por el ALB.', src:'fuera de las diapositivas' },
    { f:['alb'], t:['ecs','ec2','asg','fargate'], min:3, why:'Un servicio (destino del ALB) por microservicio: catálogo, pedidos, pagos.', src:'EV p.14' },
    { f:['ecs','ec2','asg','fargate'], t:['rds','aurora'], why:'Los microservicios usan la BD relacional.', src:'BD p.15' },
    { f:['ecs','ec2','asg','fargate'], t:['eventbridge','sns','sqs'], why:'Pedidos publica un evento y no espera a inventario ni al correo.', src:'EV p.15–19' },
    { f:['eventbridge','sns'], t:['sqs','lambda'], min:2, why:'Fan out a inventario y a notificación.', src:'EV p.18–21' },
    { f:['ecs','ec2','asg','fargate'], t:['nat'], why:'Pagos sale a la pasarela externa por NAT.', src:'fuera de las diapositivas' },
  ], text: [{ re:/multi-?az|2\s*az|dos\s*az/i, why:'Indica la alta disponibilidad (2 AZ / Multi-AZ).', src:'Requisito' }],
  inside: [
    { types:['ecs','ec2','fargate','eks','rds','aurora','elasticache'], kind:'priv', why:'Contenedores, instancias y BD en subnets privadas.' },
    { types:['alb','nat'], kind:'pub', why:'ALB y NAT en subnets públicas.' },
  ]},
  'clinica-lab': { conn: [
    { f:['actor'], t:['vpn','dx'], why:'El LIS on-premise se conecta por VPN o Direct Connect.', src:'fuera de las diapositivas' },
    { f:['vpn','dx','vpce'], t:['vpce','s3'], why:'Los PDF llegan a S3 sin pasar por internet público.', src:'fuera de las diapositivas' },
    { f:['s3','eventbridge'], t:['eventbridge','lambda'], why:'El evento de S3 dispara el procesamiento.', src:'SV p.16, p.19' },
    { f:['lambda','vpce'], t:['dynamodb'], why:'Metadatos del resultado en DynamoDB.', src:'SV p.13' },
    { f:['lambda'], t:['sns'], why:'Aviso al paciente.', src:'EV p.22' },
    { f:['actor'], t:['apigw'], why:'El paciente consulta por API Gateway.', src:'SV p.23' },
    { f:['apigw'], t:['lambda'], why:'API Gateway invoca la Lambda que genera la URL prefirmada.', src:'SV p.15' },
  ], text: [{ re:/prefirm|presign|15\s*min|expir/i, why:'Indica la URL prefirmada con expiración.', src:'Requisito' },{ re:/kms|cifr/i, why:'Indica el cifrado (KMS).', src:'Requisito' },{ re:/PK/i, why:'Indica la PK de la tabla.', src:'Se pide' }],
  inside: [{ types:COMPUTE, kind:'priv', why:'Lambdas en subnets privadas.' },{ types:['actor'], kind:'onprem', label:/lis|laborat/i, why:'El LIS va en el datacenter on-premise.' }]},
  billetera: { conn: [
    { f:['actor'], t:['apigw'], why:'La app entra por API Gateway.', src:'SV p.23' },
    { f:['apigw'], t:['lambda'], why:'API Gateway invoca la Lambda que inicia el pago.', src:'SV p.15' },
    { f:['lambda'], t:['stepfunctions'], why:'Saga: reservar → recaudar → confirmar/liberar.', src:'SV p.17' },
    { f:['stepfunctions'], t:['lambda'], min:3, why:'Pasos de la Saga como Lambdas.', src:'SV p.17' },
    { f:['lambda','vpce'], t:['dynamodb'], why:'Billeteras, Pagos e Idempotencia.', src:'SV p.13' },
    { f:['lambda','vpce'], t:['s3'], why:'Comprobante PDF en S3.', src:'SV p.13' },
    { f:['lambda','vpce'], t:['secrets'], why:'API Key del tercero en Secrets Manager.', src:'fuera de las diapositivas' },
    { f:['lambda'], t:['nat'], why:'Salida a la API de recaudación por NAT.', src:'fuera de las diapositivas' },
    { f:['lambda'], t:['vpce'], why:'VPC Endpoints para DynamoDB, S3 y Secrets Manager.', src:'fuera de las diapositivas' },
  ], text: [{ re:/PK/i, why:'Indica la PK de las tablas.', src:'Se pide' },{ re:/SK/i, why:'Indica la SK de las tablas.', src:'Se pide' },{ re:/idempot|recibo/i, why:'Indica la idempotencia por recibo.', src:'Requisito' },{ re:/retry|reintent|backoff/i, why:'Indica los reintentos con backoff.', src:'Requisito' }],
  inside: [{ types:COMPUTE, kind:'priv', why:'Cómputo en subnets privadas.' },{ types:['nat'], kind:'pub', why:'NAT en subnet pública.' },{ types:['vpce'], kind:'vpc', why:'Endpoints dentro de la VPC.' }]},
  matricula: { conn: [
    { f:['actor','cloudfront'], t:['alb'], why:'Entrada por el ALB.', src:'fuera de las diapositivas' },
    { f:['alb'], t:['ecs','ec2','asg','fargate'], min:2, why:'ALB → microservicios (cursos, matrícula).', src:'EV p.14' },
    { f:['ecs','ec2','asg','fargate','lambda'], t:['sqs'], why:'La matrícula se encola para absorber el pico.', src:'EV p.15' },
    { f:['sqs'], t:['ecs','ec2','asg','fargate','lambda'], why:'Un worker consume la cola.', src:'EV p.15' },
    { f:['ecs','ec2','asg','fargate','lambda'], t:['rds','aurora'], why:'Vacantes en la BD relacional (UPDATE condicional).', src:'BD p.15' },
    { f:['ecs','ec2','asg','fargate','lambda','eventbridge'], t:['eventbridge','ses','sns'], why:'Evento de confirmación → correo.', src:'EV p.18' },
  ], text: [{ re:/tenant|sede/i, why:'Indica el patrón multi-tenant (TENANT_ID por sede).', src:'MT p.12–14' },{ re:/vacante|>\s*0|condicion/i, why:'Indica cómo evitas la sobreventa.', src:'Requisito' },{ re:/multi-?az|2\s*az/i, why:'Indica las 2 AZ.', src:'Requisito' }],
  inside: [{ types:['ecs','ec2','fargate','eks','rds','aurora'], kind:'priv', why:'Contenedores y BD en subnets privadas.' },{ types:['alb','nat'], kind:'pub', why:'ALB y NAT en subnets públicas.' }]},
  frio: { conn: [
    { f:['actor'], t:['iotcore'], why:'Sensores MQTT → IoT Core con certificados.', src:'fuera de las diapositivas' },
    { f:['iotcore'], t:['kinesis','lambda'], why:'Regla de IoT → Kinesis (stream).', src:'SV p.20, p.22' },
    { f:['kinesis'], t:['lambda'], why:'Kinesis dispara la Lambda.', src:'SV p.22' },
    { f:['lambda','vpce'], t:['dynamodb'], why:'Lecturas y Alertas en DynamoDB.', src:'BD p.16' },
    { f:['lambda','vpce'], t:['sns'], why:'Alerta por SMS a conductor y central.', src:'EV p.20' },
    { f:['lambda','vpce'], t:['sqs'], why:'Cola hacia el ERP para reintentar sin perder.', src:'EV p.15 · SV p.16' },
    { f:['sqs'], t:['lambda'], why:'Una Lambda consume la cola y llama al ERP.', src:'SV p.16' },
    { f:['lambda','vpce'], t:['secrets'], why:'Credenciales del ERP en Secrets Manager.', src:'fuera de las diapositivas' },
    { f:['lambda','vpn','dx'], t:['dx','vpn','actor'], why:'Direct Connect al ERP on-premise.', src:'fuera de las diapositivas' },
  ], text: [{ re:/PK/i, why:'Indica la PK de las tablas.', src:'Se pide' },{ re:/SK/i, why:'Indica la SK (fecha) de las tablas.', src:'Se pide' },{ re:/dlq|dead/i, why:'Indica la DLQ.', src:'Requisito' }],
  inside: [{ types:COMPUTE, kind:'priv', why:'Lambdas en subnets privadas.' },{ types:['vpce'], kind:'vpc', why:'Endpoints dentro de la VPC.' },{ types:['actor'], kind:'onprem', label:/erp|sap/i, why:'El ERP va en el datacenter on-premise.' }]},
});

const findCase = id => CASES.find(c => c.id === id) || XCASES.find(c => c.id === id);
