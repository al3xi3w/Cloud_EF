/* Examen Final real (Prof. Santiago Silva): preguntas 2 y 3, y el simulacro completo.
   Las soluciones son conocimiento general de AWS (fuera de las diapositivas de Clases/). */

SERVICES.push(
  { id:'textract', name:'Amazon Textract', cat:'ml', fuera:'general',
    que:'Servicio de ML que <b>extrae texto, formularios y tablas</b> de documentos escaneados y PDF (OCR inteligente).',
    src:'En clase, el texto se analiza con Comprehend (SV p.16, p.18)',
    cuando:['Leer datos de una denuncia policial, una factura o un DNI escaneado.','Desde una VPC privada se consume con un <b>Interface endpoint</b>, sin salir a internet.'],
    ejemplos:['Siniestros vehiculares (Examen Final, pregunta 3)'] },
);
Object.assign(SVC, Object.fromEntries(SERVICES.map(s => [s.id, s])));
SVC.rekognition.cuando.push('<span class="tag warn">fuera de las diapositivas</span> Para detectar algo específico, como daños en un vehículo, se entrena un modelo con <b>Rekognition Custom Labels</b>. Desde una VPC privada se usa con un <b>Interface endpoint</b>.');

const banco = XCASES.find(c => c.id === 'banco');
banco.title = 'Transferencias interbancarias (Examen Final, pregunta 1)';
banco.real = 1;

XCASES.push(
{ id:'sunat', kind:'real', real:2, pts:7, title:'Pedidos online con facturación electrónica SUNAT (Examen Final, pregunta 2)',
  enunciado:'<b>Súper Andino</b>, cadena de supermercados con presencia en Lima y provincias, lanzará su e-commerce para campañas tipo Cyber Wow, con picos de <b>5,000 pedidos por minuto</b>. Al crear un pedido se debe <b>reservar el stock</b>, <b>cobrar</b> mediante una pasarela de pagos externa, <b>emitir el comprobante electrónico</b> (boleta o factura) a través de un OSE/SUNAT y enviar el PDF al cliente. Si el pago falla, el stock reservado debe liberarse. El catálogo y el inventario deben responder en milisegundos y los comprobantes (XML/PDF) se conservan durante <b>5 años</b>. El ERP (SAP) del cliente corre on-premise y debe recibir el pedido confirmado.',
  requisitos:['La API pública debe estar protegida contra bots y uso abusivo.','Las credenciales de la pasarela y la clave SOL no pueden estar en el código.','Debe evitarse la sobreventa de stock.','Debe tolerar intermitencias del OSE/SUNAT.'],
  sepide:'El diagrama de arquitectura solución <b>100% AWS</b> indicando VPC, subnets, VPC Endpoints, NAT Gateway, conexión on-premise hacia el SAP y las tablas de DynamoDB con su clave (PK/SK). Servicios mínimos: API Gateway, Lambda, Step Functions, DynamoDB, S3 y Secrets Manager.',
  pistas:['Bots y uso abusivo → ¿qué se pone delante de API Gateway? ¿Y qué límites tiene el propio API Gateway?','“Responder en milisegundos” y “evitar la sobreventa” apuntan a DynamoDB con escrituras condicionales.','Reservar → cobrar → (si falla) liberar es una Saga, como en la pregunta 1.','La pasarela y el OSE están en internet: ¿por dónde salen las Lambdas privadas?','Para tolerar intermitencias del OSE: reintentos con backoff y una cola para emitir después.','Conservar 5 años en S3: ciclo de vida a Glacier y Object Lock.','El SAP on-premise recibe el pedido confirmado de forma asíncrona, por una cola con DLQ y Direct Connect o VPN.'],
  diagram:'x_sunat',
  flujo:[
    'El cliente inicia sesión con <b>Cognito</b> (JWT). Las solicitudes pasan por <b>AWS WAF</b> (Bot Control, reglas por tasa de IP) y por <b>API Gateway</b>, que aplica throttling y usage plans.',
    '<code>GET /catalogo</code> → <b>λ catálogo/stock</b> → <b>DynamoDB</b> (Gateway endpoint): responde en milisegundos. Se puede agregar caché en API Gateway o DAX.',
    '<code>POST /pedidos</code> (con Idempotency-Key) → <b>λ crearPedido</b> guarda el pedido <code>PENDIENTE</code> e inicia <b>Step Functions</b>. Para los picos de 5,000/min se puede poner una <b>cola SQS</b> delante y concurrencia reservada.',
    '<b>Saga en Step Functions</b>: <i>ReservarStock</i> (<code>TransactWriteItems</code> con la condición <code>stock - reservado &gt;= cantidad</code> por cada producto, para que no haya sobreventa) → <i>Cobrar</i>.',
    '<b>λ cobrar</b> lee las credenciales de la pasarela en <b>Secrets Manager</b> (Interface endpoint) y sale por el <b>NAT Gateway</b>. Si el pago falla, el <code>Catch</code> ejecuta <b>LiberarStock</b> (compensación), marca el pedido <code>RECHAZADO</code> y notifica.',
    '<b>λ emitir comprobante</b> arma el XML, lo firma y lo envía al <b>OSE/SUNAT</b> con la <b>clave SOL</b> leída de Secrets Manager. Tiene <code>Retry</code> con backoff exponencial. Si el OSE sigue caído, el pedido queda <code>CPE_PENDIENTE</code> y la emisión se reintenta desde una cola SQS con DLQ, sin bloquear la venta.',
    'El XML y el PDF se guardan en <b>S3</b> (Gateway endpoint) con <b>SSE-KMS</b>, un <b>ciclo de vida</b> a S3 Glacier y <b>Object Lock</b> de 5 años. <b>SES</b> envía el PDF (o una URL prefirmada) al cliente.',
    'El pedido confirmado va a una <b>cola SQS (+ DLQ)</b>. <b>λ syncSAP</b> lo envía al <b>SAP on-premise</b> por el Virtual Private Gateway y <b>Direct Connect</b>, con VPN de respaldo.',
  ],
  tabla:[
    ['API protegida contra bots y abuso','<b>AWS WAF</b> (Bot Control, reglas por tasa, reglas administradas) delante de API Gateway, más <b>throttling y usage plans</b> en API Gateway y <b>JWT de Cognito</b>.'],
    ['Credenciales de la pasarela y clave SOL','En <b>Secrets Manager</b> (KMS, rotación), leídas en tiempo de ejecución con el rol IAM de cada Lambda por un Interface endpoint.'],
    ['Evitar la sobreventa','<b>Escritura condicional / transacción en DynamoDB</b>: <code>stock - reservado &gt;= cantidad</code>. Si no se cumple, se rechaza la reserva. Además, idempotencia por pedido.'],
    ['Tolerar intermitencias del OSE/SUNAT','<code>Retry</code> con backoff exponencial y, si se agota, la emisión pasa a una <b>cola SQS</b> que reintenta más tarde (DLQ y alarma de CloudWatch). La venta no se cae porque el comprobante se emite de forma asíncrona.'],
    ['Picos de 5,000 pedidos/min','Lambda escala sola (LM p.12), con concurrencia reservada para crearPedido y SQS como amortiguador si hace falta.'],
    ['Comprobantes 5 años','S3 con ciclo de vida a <b>Glacier</b> y <b>Object Lock</b> (retención de 5 años), cifrado con KMS.'],
  ],
  ddb:[
    { tabla:'Productos', pk:'PROD#&lt;sku&gt;', sk:'METADATA', attrs:'nombre, precio, categoría', uso:'Catálogo en milisegundos (GetItem). GSI por categoría.' },
    { tabla:'Inventario', pk:'PROD#&lt;sku&gt;', sk:'ALMACEN#&lt;almacenId&gt;', attrs:'stock, reservado', uso:'Reserva y liberación con escritura condicional (sin sobreventa).' },
    { tabla:'Pedidos', pk:'CLIENTE#&lt;clienteId&gt;', sk:'PED#&lt;fechaISO&gt;#&lt;pedidoId&gt;', attrs:'items, total, estado (PENDIENTE · PAGADO · RECHAZADO · CPE_PENDIENTE · CONFIRMADO), idempotencyKey', uso:'Historial del cliente. GSI por pedidoId.' },
    { tabla:'Comprobantes', pk:'PED#&lt;pedidoId&gt;', sk:'CPE#&lt;serie&gt;-&lt;numero&gt;', attrs:'tipo (boleta/factura), estadoSUNAT, s3Xml, s3Pdf, intentos', uso:'Estado de emisión y reintentos ante el OSE.' },
  ],
  notas:['<span class="tag warn">fuera de las diapositivas</span> WAF, VPC, NAT, endpoints, Direct Connect, Secrets Manager, Saga, Object Lock y Glacier no están en <code>Clases/</code>. Lambda, API Gateway, Step Functions, DynamoDB, S3, SQS con DLQ y SNS sí lo están (SV p.11–17, EV p.15).','Las 2 AZ (subnets y NAT por AZ) no están dibujadas: escríbelo en el examen.'],
  req:['waf','apigw','lambda','stepfunctions','dynamodb','s3','secrets','nat','vpce','dx','sqs'],
},
{ id:'siniestros', kind:'real', real:3, pts:7, title:'Siniestros vehiculares (Examen Final, pregunta 3)',
  enunciado:'<b>Seguros La Cordillera</b> desea digitalizar el reporte de siniestros vehiculares. El asegurado reporta el siniestro desde la app y sube <b>fotos del vehículo</b> y la <b>denuncia policial en PDF</b>, sin que los archivos pesados pasen por la API. El sistema debe validar que la <b>póliza esté vigente</b>, analizar las fotos con <b>IA</b> para detectar daños y extraer los datos de la denuncia. Si el monto estimado es <b>menor a S/ 5,000</b> se aprueba automáticamente; en caso contrario, un <b>ajustador humano</b> debe aprobar (puede tardar días). Al aprobar, se ordena el pago al <b>sistema financiero on-premise</b>. Se requiere trazabilidad completa del proceso.',
  requisitos:['Las credenciales de la integración financiera no pueden estar en el código.','El flujo debe poder esperar días a la decisión del ajustador sin costo de cómputo.','Los servicios de IA no deben consumirse a través de internet.','Si la póliza no está vigente, el siniestro se rechaza y se notifica al asegurado.'],
  sepide:'El diagrama de arquitectura solución <b>100% AWS</b> indicando VPC, subnets, VPC Endpoints, conexión on-premise hacia el core financiero y las tablas de DynamoDB con su clave (PK/SK). Servicios mínimos: API Gateway, Lambda, Step Functions, DynamoDB, S3 y Secrets Manager.',
  pistas:['“Sin que los archivos pasen por la API” → URLs prefirmadas de S3: la app sube directo a S3.','IA para fotos → Rekognition (SV p.18). IA para el PDF → Textract.','“IA sin internet” → Lambdas en subnet privada + Interface endpoints de Rekognition y Textract.','“Esperar días sin costo de cómputo” → Step Functions Standard con <code>.waitForTaskToken</code>: el flujo se pausa y no hay ninguna Lambda corriendo.','La regla de S/ 5,000 y la póliza vencida son estados <i>Choice</i> en Step Functions.','Trazabilidad → historial de ejecución de Step Functions, una tabla de eventos y CloudTrail.'],
  diagram:'x_siniestros',
  flujo:[
    'El asegurado inicia sesión con <b>Cognito</b> y llama a <code>POST /siniestros</code> en <b>API Gateway</b>. <b>λ crearSiniestro</b> registra el siniestro y devuelve <b>URLs prefirmadas de S3</b>.',
    'La app <b>sube las fotos y el PDF directo a S3</b>, sin pasar por la API. Luego llama a <code>POST /siniestros/{id}/enviar</code> (o un evento de S3) y se inicia <b>Step Functions (Standard)</b>.',
    '<i>ValidarPóliza</i>: <b>λ validarPóliza</b> consulta DynamoDB. Un estado <i>Choice</i> decide: si no está vigente → <b>RECHAZADO</b> y notificación por <b>SNS</b> al asegurado, y el flujo termina.',
    '<i>Parallel</i>: <b>λ analizarFotos</b> usa <b>Rekognition</b> (Custom Labels de daños) y <b>λ extraerDenuncia</b> usa <b>Textract</b>, ambos por <b>Interface endpoints</b>: la IA no se consume por internet. Leen los archivos de S3 por el Gateway endpoint.',
    '<i>Choice</i> por monto estimado: <b>&lt; S/ 5,000 → aprobación automática</b>. Si es mayor, la tarea <b>EsperarAjustador</b> usa <code>.waitForTaskToken</code>: guarda el token en DynamoDB, notifica al ajustador y <b>la ejecución queda pausada días sin cómputo</b>.',
    'El ajustador decide en su app → <b>API Gateway</b> → <b>λ decisión</b> → <code>SendTaskSuccess</code> o <code>SendTaskFailure</code> con el token (Interface endpoint de Step Functions). El flujo continúa.',
    '<i>OrdenarPago</i>: <b>λ ordenarPago</b> lee las credenciales de <b>Secrets Manager</b> y llama al <b>core financiero on-premise</b> por el Virtual Private Gateway y <b>Direct Connect</b> (VPN de respaldo), con <code>Retry</code>. Al final se notifica al asegurado.',
    '<b>Trazabilidad</b>: historial de cada ejecución de Step Functions, tabla <b>Eventos</b> en DynamoDB (cada cambio de estado), <b>CloudTrail</b> y CloudWatch Logs.',
  ],
  tabla:[
    ['Credenciales financieras fuera del código','<b>Secrets Manager</b> + rol IAM de λ ordenarPago, por un Interface endpoint.'],
    ['Esperar días sin costo de cómputo','<b>Step Functions Standard</b> (una ejecución puede durar hasta 1 año) con <b>callback</b> <code>.waitForTaskToken</code>: no hay Lambda corriendo mientras espera.'],
    ['IA sin pasar por internet','Lambdas en <b>subnets privadas</b> + <b>Interface endpoints</b> de Rekognition y Textract, y Gateway endpoint de S3.'],
    ['Póliza no vigente','Estado <i>Choice</i> → <b>Rechazar</b> → notificación SNS/SES al asegurado.'],
    ['Archivos pesados fuera de la API','<b>URLs prefirmadas de S3</b>: subida directa desde la app.'],
    ['Trazabilidad completa','Historial de Step Functions, tabla Eventos, CloudTrail y CloudWatch Logs.'],
  ],
  ddb:[
    { tabla:'Polizas', pk:'POLIZA#&lt;nroPoliza&gt;', sk:'METADATA', attrs:'clienteId, placa, vigenteDesde, vigenteHasta, cobertura', uso:'Validar vigencia (GetItem). GSI por placa o clienteId.' },
    { tabla:'Siniestros', pk:'ASEGURADO#&lt;clienteId&gt;', sk:'SIN#&lt;fechaISO&gt;#&lt;siniestroId&gt;', attrs:'nroPoliza, estado, montoEstimado, s3Fotos[], s3Denuncia, taskToken, executionArn', uso:'Siniestros del asegurado ordenados por fecha. GSI por siniestroId y por estado (bandeja del ajustador).' },
    { tabla:'Eventos (trazabilidad)', pk:'SIN#&lt;siniestroId&gt;', sk:'EVT#&lt;fechaISO&gt;#&lt;tipo&gt;', attrs:'actor, detalle, resultado', uso:'Línea de tiempo completa del proceso.' },
  ],
  notas:['<span class="tag warn">fuera de las diapositivas</span> Textract, Rekognition Custom Labels, VPC, endpoints, Direct Connect, Secrets Manager y <code>.waitForTaskToken</code> no están en <code>Clases/</code>. Rekognition, S3 → Lambda, Step Functions y SNS sí lo están (SV p.12–19, EV p.22).','Step Functions también puede llamar a Rekognition y Textract directamente (integraciones de servicio). Se usan Lambdas en la VPC para que la llamada vaya por los endpoints, como pide el requisito.'],
  req:['apigw','lambda','stepfunctions','dynamodb','s3','secrets','rekognition','textract','vpce','dx','sns','cognito'],
},
);

Object.assign(DIAGRAMS, {
  x_sunat: { cw: 205, nodes: [
      ['cli','Cliente (web / app)','cliente',0,2.4], ['cog','Cognito','seguridad',1,1.2,'JWT'], ['api','API Gateway + WAF','integracion',1,2.4,'Bot Control · throttling'],
      ['sfn','Step Functions','integracion',1,3.4,'Saga: reservar → cobrar → CPE'], ['q','SQS pedidos → SAP','integracion',1,5.4,'+ DLQ'],
      ['lcat','λ catálogo / stock','computo',2,1.2], ['lped','λ crearPedido','computo',2,2.4,'idempotencia'], ['lres','λ reservar / liberar stock','computo',2,4.3,'condición stock'], ['lsap','λ syncSAP','computo',2,5.4],
      ['lpay','λ cobrar','computo',3,1.2], ['lcpe','λ emitir comprobante','computo',3,2.8,'Retry backoff · cola'],
      ['nat','NAT Gateway','red',4,0.2], ['e1','VPC Endpoint (Gateway)','red',4,1.8,'DynamoDB · S3'], ['e2','VPC Endpoint (Interface)','red',4,3.0,'Secrets · SES · SQS'], ['vgw','Virtual Private Gateway','red',4,5.4],
      ['igw','Internet Gateway','red',5,0.2], ['ddb','DynamoDB','datos',5,1.3,'Productos · Inventario · Pedidos · Comprobantes'], ['s3','S3 comprobantes','datos',5,2.3,'XML/PDF · Object Lock 5 años'],
      ['sm','Secrets Manager','seguridad',5,3.3,'pasarela · clave SOL'], ['ses','Amazon SES','integracion',5,4.3,'PDF al cliente'], ['dx','Direct Connect','red',5,5.4,'+ VPN respaldo'],
      ['pas','Pasarela de pagos','cliente',6,-0.4], ['ose','OSE / SUNAT','cliente',6,0.6], ['cc','Cliente (correo)','cliente',6,4.3], ['sap','SAP (ERP)','cliente',6,5.4] ],
    edges: [['cli','cog'],['cli','api'],['api','lcat','GET'],['api','lped','POST'],['lcat','e1'],['lped','sfn','StartExecution'],['lped','e1'],
      ['sfn','lres'],['sfn','lpay'],['sfn','lcpe'],['sfn','q','confirmado'],['q','lsap'],['lres','e1'],['lpay','nat'],['lcpe','nat'],['nat','igw'],['igw','pas'],['igw','ose'],
      ['lpay','e2'],['lcpe','e2'],['e1','ddb'],['e1','s3'],['e2','sm'],['e2','ses'],['ses','cc'],['lsap','vgw'],['vgw','dx'],['dx','sap']],
    groups: [['AWS Cloud',1,0.2,5,5.4,'cloud'],['VPC',2,0.2,4,5.4,'vpc'],['Subnet pública',4,0.2,4,0.2,'pub'],['Subnets privadas (2 AZ)',2,1.2,3,5.4,'priv'],['Datacenter',6,5.4,6,5.4,'onprem']] },
  x_siniestros: { cw: 205, nodes: [
      ['as','Asegurado (app)','cliente',0,2.4], ['aj','Ajustador (web)','cliente',0,5.4],
      ['s3','S3 fotos y denuncias','datos',1,0.2,'subida directa (URL prefirmada)'], ['cog','Cognito','seguridad',1,1.3,'JWT'], ['api','API Gateway','integracion',1,2.4],
      ['sfn','Step Functions (Standard)','integracion',1,4.0,'Choice · Parallel · waitForTaskToken'], ['api2','API Gateway /decision','integracion',1,5.4],
      ['lsin','λ crearSiniestro','computo',2,2.4,'URLs prefirmadas'], ['ldec','λ decisión ajustador','computo',2,5.4,'SendTaskSuccess (token)'],
      ['lfot','λ analizarFotos','computo',3,1.4], ['lden','λ extraerDenuncia','computo',3,2.5], ['lpol','λ validarPóliza','computo',3,3.6], ['lpag','λ ordenarPago','computo',3,4.7],
      ['e1','VPC Endpoint (Gateway)','red',4,0.4,'S3 · DynamoDB'], ['e2','VPC Endpoint (Interface)','red',4,1.9,'Rekognition · Textract'], ['e3','VPC Endpoint (Interface)','red',4,3.3,'Secrets · SNS · States'], ['vgw','Virtual Private Gateway','red',4,4.7],
      ['ddb','DynamoDB','datos',5,0.4,'Polizas · Siniestros · Eventos'], ['rek','Rekognition','ml',5,1.4,'Custom Labels: daños'], ['tex','Amazon Textract','ml',5,2.4,'datos de la denuncia'],
      ['sm','Secrets Manager','seguridad',5,3.3,'credenciales financieras'], ['sns','Amazon SNS','integracion',5,4.0,'notificaciones'], ['dx','Direct Connect','red',5,4.9,'+ VPN respaldo'],
      ['ct','CloudTrail + historial','monitoreo',5,5.9,'trazabilidad'], ['core','Core financiero','cliente',6,4.9], ['nt','Asegurado / ajustador','cliente',6,3.2,'SMS / correo'] ],
    edges: [['as','cog'],['as','api','POST /siniestros'],['as','s3'],['api','lsin'],['lsin','e1'],['lsin','sfn','StartExecution'],
      ['sfn','lpol'],['sfn','lfot'],['sfn','lden'],['sfn','lpag'],['lpol','e1'],['lfot','e2'],['lden','e2'],['lfot','e1'],['e2','rek'],['e2','tex'],['e1','ddb'],
      ['lpag','e3'],['e3','sm'],['e3','sns'],['sns','nt'],['lpag','vgw'],['vgw','dx'],['dx','core'],['aj','api2','aprobar / rechazar'],['api2','ldec'],['ldec','sfn']],
    groups: [['AWS Cloud',1,0.2,5,5.9,'cloud'],['VPC',2,0.4,4,5.4,'vpc'],['Subnets privadas (2 AZ)',2,1.4,3,5.4,'priv'],['Datacenter',6,4.9,6,4.9,'onprem']] },
});

const COMPUTE2 = ['lambda','ecs','ec2','fargate','eks'];
Object.assign(GRADING, {
  sunat: { conn: [
    { f:['actor','cloudfront'], t:['apigw','waf'], why:'El cliente entra por API Gateway protegido con WAF.', src:'SV p.23 · fuera de las diapositivas' },
    { f:['apigw','waf'], t:['lambda','apigw'], why:'API Gateway invoca las Lambdas de catálogo y pedidos.', src:'SV p.15' },
    { f:['lambda','sqs','apigw'], t:['stepfunctions'], why:'El pedido inicia la Saga en Step Functions.', src:'SV p.17' },
    { f:['stepfunctions'], t:['lambda','sqs'], min:3, why:'Pasos de la Saga: reservar/liberar stock, cobrar, emitir comprobante, enviar a SAP.', src:'SV p.17' },
    { f:['lambda','vpce'], t:['dynamodb'], why:'Catálogo, inventario y pedidos en DynamoDB (milisegundos).', src:'SV p.13 · BD p.12' },
    { f:['lambda','vpce'], t:['s3'], why:'Comprobantes XML/PDF en S3.', src:'SV p.13' },
    { f:['lambda','vpce'], t:['secrets'], why:'Credenciales de la pasarela y clave SOL en Secrets Manager.', src:'fuera de las diapositivas' },
    { f:['lambda'], t:['nat'], why:'Pasarela y OSE están en internet: salida por NAT.', src:'fuera de las diapositivas' },
    { f:['nat','igw'], t:['igw','actor'], why:'NAT → Internet Gateway → pasarela / OSE.', src:'fuera de las diapositivas' },
    { f:['lambda','sqs','vpn','dx'], t:['dx','vpn','actor'], why:'Pedido confirmado al SAP on-premise por Direct Connect o VPN.', src:'fuera de las diapositivas' },
    { f:['lambda','vpce'], t:['ses','sns'], why:'Envío del PDF al cliente.', src:'EV p.22' },
  ], text: [
    { re:/PK/i, why:'Indica la PK de las tablas DynamoDB.', src:'Se pide' },{ re:/SK/i, why:'Indica la SK de las tablas.', src:'Se pide' },
    { re:/liber|compens|saga|catch/i, why:'Indica la compensación (liberar stock si el pago falla).', src:'Enunciado' },
    { re:/stock|sobreventa|condici/i, why:'Indica cómo evitas la sobreventa (escritura condicional).', src:'Requisito' },
    { re:/retry|reintent|backoff|dlq/i, why:'Indica cómo toleras las intermitencias del OSE (reintentos, cola, DLQ).', src:'Requisito' },
    { re:/5\s*a[ñn]os|glacier|object\s*lock|ciclo|lifecycle/i, why:'Indica la retención de 5 años de los comprobantes.', src:'Enunciado' },
  ], inside: [
    { types:COMPUTE2, kind:'priv', why:'Lambdas en subnets privadas.' },
    { types:['nat'], kind:'pub', why:'NAT Gateway en subnet pública.' },
    { types:['vpce'], kind:'vpc', why:'VPC Endpoints dentro de la VPC.' },
    { types:['actor'], kind:'onprem', label:/sap|erp/i, why:'El SAP va en el datacenter on-premise.' },
  ]},
  siniestros: { conn: [
    { f:['actor'], t:['apigw'], min:2, why:'Asegurado y ajustador usan API Gateway.', src:'SV p.23' },
    { f:['actor'], t:['s3'], why:'La app sube fotos y PDF directo a S3 (URL prefirmada), sin pasar por la API.', src:'SV p.19 · fuera de las diapositivas' },
    { f:['apigw'], t:['lambda'], why:'API Gateway invoca las Lambdas.', src:'SV p.15' },
    { f:['lambda','s3','eventbridge'], t:['stepfunctions'], why:'Se inicia el flujo en Step Functions.', src:'SV p.17' },
    { f:['stepfunctions'], t:['lambda'], min:3, why:'Pasos: validar póliza, analizar fotos, extraer denuncia, ordenar pago.', src:'SV p.17' },
    { f:['lambda','vpce','stepfunctions'], t:['rekognition'], why:'Rekognition analiza las fotos.', src:'SV p.18' },
    { f:['lambda','vpce','stepfunctions'], t:['textract'], why:'Textract extrae los datos de la denuncia.', src:'fuera de las diapositivas' },
    { f:['lambda','vpce'], t:['dynamodb'], why:'Pólizas, siniestros y eventos en DynamoDB.', src:'SV p.13' },
    { f:['lambda','vpce'], t:['secrets'], why:'Credenciales financieras en Secrets Manager.', src:'fuera de las diapositivas' },
    { f:['lambda','vpn','dx'], t:['dx','vpn','actor'], why:'Pago al core financiero on-premise por Direct Connect o VPN.', src:'fuera de las diapositivas' },
    { f:['lambda','vpce','stepfunctions'], t:['sns','ses'], why:'Notificación al asegurado (rechazo o aprobación).', src:'EV p.22' },
    { f:['lambda'], t:['stepfunctions'], min:2, why:'La decisión del ajustador reanuda el flujo con el task token.', src:'fuera de las diapositivas' },
  ], text: [
    { re:/PK/i, why:'Indica la PK de las tablas DynamoDB.', src:'Se pide' },{ re:/SK/i, why:'Indica la SK de las tablas.', src:'Se pide' },
    { re:/token|callback|wait/i, why:'Indica cómo se espera al ajustador sin cómputo (.waitForTaskToken).', src:'Requisito' },
    { re:/5[ ,.]?000|monto|choice/i, why:'Indica la regla de aprobación automática (< S/ 5,000).', src:'Enunciado' },
    { re:/prefirm|presign/i, why:'Indica las URLs prefirmadas (archivos fuera de la API).', src:'Enunciado' },
    { re:/traza|cloudtrail|historial|evento/i, why:'Indica cómo logras la trazabilidad.', src:'Enunciado' },
  ], inside: [
    { types:COMPUTE2, kind:'priv', why:'Lambdas en subnets privadas (la IA se consume por endpoints, no por internet).' },
    { types:['vpce'], kind:'vpc', why:'VPC Endpoints dentro de la VPC.' },
    { types:['actor'], kind:'onprem', label:/financ|core/i, why:'El core financiero va en el datacenter on-premise.' },
  ]},
});

/* Simulacro del Examen Final real */
const EXAMEN_REAL = { title:'Examen Final (Prof. Santiago Silva)', min:110, items:[{ id:'banco', pts:6 }, { id:'sunat', pts:7 }, { id:'siniestros', pts:7 }],
  instrucciones:['La prueba dura 110 minutos.','Solo está permitido el formulario de ayuda: no revises la web ni tus apuntes mientras rindes.','Si no sabes la respuesta, deja la pregunta en blanco.'] };
