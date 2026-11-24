/* VPC Link (API Gateway → recursos privados en la VPC).
   Fuera de las diapositivas de Clases/: conocimiento general de AWS. */

SERVICES.push(
  { id:'vpclink', name:'API Gateway VPC Link', cat:'red', fuera:'general',
    que:'Permite que <b>API Gateway</b> (un servicio administrado que está <b>fuera</b> de tu VPC) llegue a recursos <b>privados dentro de la VPC</b> (un balanceador interno delante de contenedores o instancias) <b>sin exponerlos a internet</b>. Crea interfaces de red en tus subnets privadas.',
    src:'—',
    cuando:['El backend de la API son <b>contenedores (ECS/EKS) o instancias EC2</b> en subnets privadas, detrás de un balanceador <b>interno</b>.','<b>REST API</b>: VPC Link hacia un <b>Network Load Balancer</b> interno. <b>HTTP API</b>: VPC Link hacia un <b>ALB</b>, un <b>NLB</b> o AWS Cloud Map.','<b>No hace falta para Lambda</b>: API Gateway invoca a la Lambda directamente, aunque esté conectada a la VPC.'],
    ejemplos:['Práctica: API de stock para apps de delivery'] },
  { id:'nlb', name:'Network Load Balancer', cat:'red', fuera:'general',
    que:'Balanceador de carga de <b>capa 4 (TCP/UDP)</b> de Elastic Load Balancing, de muy baja latencia. Puede ser <b>interno</b> (solo con IPs privadas, en subnets privadas).',
    src:'Sílabo 6.5.3 Balanceo de carga (sin diapositivas en Clases/)',
    cuando:['Como destino de un <b>VPC Link de una REST API</b> de API Gateway.','Cuando necesitas TCP puro o IPs fijas. Para enrutar HTTP por ruta (<code>/stock</code>, <code>/precios</code>) se usa el <b>ALB</b>.'],
    ejemplos:['Práctica: API de stock para apps de delivery'] },
);
Object.assign(SVC, Object.fromEntries(SERVICES.map(s => [s.id, s])));

Object.assign(DIAGRAMS, {
  vpclink_demo: { cw: 250, nodes: [
      ['c','Cliente','cliente',0,0.6], ['api','API Gateway','integracion',1,0.6],
      ['vl','VPC Link','red',2,0], ['lb','NLB / ALB interno','red',3,0], ['ecs','ECS / EC2','computo',4,0,'subnets privadas'],
      ['lam','AWS Lambda','computo',2,1.4,'invocación directa'] ],
    edges: [['c','api'],['api','vl','contenedores / EC2'],['vl','lb'],['lb','ecs'],['api','lam','sin VPC Link']],
    groups: [['VPC',2,0,4,1.4,'vpc'],['Subnets privadas',2,0,4,1.4,'priv']] },
});

CONCEPTS.push({ t:'VPC Link: API Gateway hacia contenedores o instancias privadas', h:`
<p>API Gateway es un servicio administrado que vive <b>fuera</b> de tu VPC. Si el backend son <b>contenedores o instancias</b> en subnets privadas, API Gateway no puede llegar a ellos por sí solo. Las opciones serían exponerlos con un balanceador público, o crear un <b>VPC Link</b>.</p>
{{dia:vpclink_demo}}
<ul>
<li><b>REST API</b> → VPC Link → <b>Network Load Balancer interno</b> → tareas ECS o instancias EC2.</li>
<li><b>HTTP API</b> → VPC Link → <b>ALB interno</b>, <b>NLB interno</b> o <b>Cloud Map</b>.</li>
<li>El balanceador es <b>interno</b> y va en <b>subnets privadas</b>: nada del backend queda expuesto a internet. Solo API Gateway (con WAF, API keys, JWT y throttling) es público.</li>
<li><b>Lambda NO necesita VPC Link</b>: API Gateway la invoca directamente, aunque la Lambda esté conectada a la VPC. Error típico de examen: dibujar VPC Link delante de una Lambda.</li>
<li>No lo confundas con la <b>API privada</b> de API Gateway, que es al revés: clientes <i>dentro</i> de la VPC llaman a la API por un Interface endpoint <code>execute-api</code>.</li>
<li>En el diagrama, el VPC Link se dibuja entre API Gateway y el balanceador interno, en el borde de la VPC o en la subnet privada.</li>
</ul>` });

XCASES.push({ id:'stock-api', kind:'practica', pts:6, title:'API de stock para apps de delivery (VPC Link)',
  enunciado:'La cadena <b>Farmacias Salud+</b> (300 locales) quiere vender por apps de delivery de terceros. Expondrá una <b>API pública</b> para que los partners consulten el <b>stock por local</b> (en milisegundos) y los <b>precios</b>. El backend ya existe como <b>microservicios en contenedores</b> (stock y precios) y no se va a reescribir a Lambda. Los precios están en una base de datos relacional. Cada noche, un servicio sincroniza el maestro de productos desde el <b>ERP (SAP) on-premise</b>, conectado por Direct Connect.',
  requisitos:['Los contenedores y sus balanceadores no pueden ser accesibles desde internet (ni con un ALB público).','Cada partner usa su propia API key con un límite de solicitudes por segundo y una cuota diaria.','La API debe estar protegida contra ataques comunes y bots.','Las credenciales de la base de datos y del ERP no pueden estar en el código.','Alta disponibilidad en 2 zonas de disponibilidad.'],
  sepide:'El diagrama de arquitectura solución 100% AWS indicando VPC, subnets privadas, cómo API Gateway llega a los contenedores privados, VPC Endpoints, conexión on-premise y la tabla de DynamoDB con su clave (PK/SK). Servicios mínimos: API Gateway, VPC Link, ECS Fargate, DynamoDB, Aurora y Secrets Manager.',
  pistas:['API Gateway está fuera de la VPC y los contenedores son privados: ¿qué pieza los conecta?','Con una REST API, el VPC Link apunta a un Network Load Balancer <b>interno</b>.','API keys + límites por partner = <b>usage plans</b> de API Gateway (throttling y cuota).','Stock en milisegundos → DynamoDB con PK = local y SK = producto.','Las tareas ECS en subnets privadas llegan a DynamoDB y a Secrets Manager por VPC Endpoints.'],
  diagram:'x_stockapi',
  flujo:[
    'Los partners llaman a <b>API Gateway (REST)</b> con su <code>x-api-key</code>. Un <b>usage plan</b> por partner define el throttling (req/s) y la cuota diaria. <b>AWS WAF</b> filtra ataques y bots. Se puede activar la caché de API Gateway para precios.',
    'API Gateway usa una integración privada por <b>VPC Link</b> hacia un <b>Network Load Balancer interno</b> en las subnets privadas (2 AZ).',
    'El NLB reparte el tráfico a los servicios <b>ECS Fargate</b> (stock y precios) en subnets privadas, con Service Auto Scaling.',
    '<b>Stock</b> lee DynamoDB por el <b>Gateway endpoint</b> (<code>PK = LOCAL#id</code>, <code>SK = PROD#sku</code>): respuesta en milisegundos.',
    '<b>Precios</b> lee <b>Aurora Multi-AZ</b> (subnet privada de datos), con la contraseña en <b>Secrets Manager</b> (Interface endpoint).',
    '<b>ECS: sync ERP</b> (tarea programada cada noche) lee las credenciales en Secrets Manager, trae el maestro del <b>SAP on-premise</b> por el Virtual Private Gateway y <b>Direct Connect</b>, y actualiza Aurora y DynamoDB.',
    '<b>CloudWatch</b> guarda los access logs de API Gateway y las métricas de cada partner.',
  ],
  tabla:[
    ['Contenedores y balanceadores no expuestos','ECS y el <b>NLB interno</b> en subnets privadas. API Gateway llega a ellos por <b>VPC Link</b>, sin ALB público.'],
    ['API key, límite y cuota por partner','<b>API keys + usage plans</b> de API Gateway (throttling y cuota).'],
    ['Ataques y bots','<b>AWS WAF</b> en API Gateway (reglas administradas, Bot Control, límites por IP).'],
    ['Credenciales','<b>Secrets Manager</b> (BD y ERP) con el rol IAM de la tarea ECS.'],
    ['Alta disponibilidad','NLB, tareas ECS y Aurora en <b>2 AZ</b> (Aurora Multi-AZ).'],
  ],
  ddb:[{ tabla:'StockLocal', pk:'LOCAL#&lt;localId&gt;', sk:'PROD#&lt;sku&gt;', attrs:'stock, actualizadoEn', uso:'Stock de un producto en un local (GetItem) o de todo el local (Query). GSI por sku para buscar en qué locales hay stock.' }],
  notas:['<span class="tag warn">fuera de las diapositivas</span> VPC Link, NLB, usage plans, WAF, Aurora, VPC y Direct Connect no están en <code>Clases/</code>. Contenedores (CT p.11–13) y DynamoDB (SV p.13, BD p.12) sí lo están.','Si fuera una <b>HTTP API</b>, el VPC Link también podría apuntar a un ALB interno. Si el backend fuera Lambda, no haría falta VPC Link.'],
  req:['apigw','vpclink','nlb','ecs','dynamodb','rds','secrets','vpce','dx','waf'],
});

Object.assign(DIAGRAMS, {
  x_stockapi: { cw: 205, nodes: [
      ['p','Apps de delivery (partners)','cliente',0,1.4,'x-api-key'], ['api','API Gateway (REST) + WAF','integracion',1,1.4,'usage plans · caché'], ['cw','CloudWatch','monitoreo',1,2.8,'access logs por partner'],
      ['vl','VPC Link','red',2,1.4], ['nlb','NLB interno','red',3,1.4,'2 AZ'],
      ['st','ECS Fargate: stock','computo',4,0.6,'Auto Scaling'], ['pr','ECS Fargate: precios','computo',4,1.8,'Auto Scaling'], ['sy','ECS: sync ERP','computo',4,3.2,'tarea nocturna'],
      ['e1','VPC Endpoint (Gateway)','red',5,0.4,'DynamoDB'], ['db','Aurora Multi-AZ','datos',5,1.8,'precios · productos'], ['e2','VPC Endpoint (Interface)','red',5,3.2,'Secrets Manager'], ['vgw','Virtual Private Gateway','red',5,4.4],
      ['ddb','DynamoDB StockLocal','datos',6,0.4,'PK LOCAL# · SK PROD#'], ['sm','Secrets Manager','seguridad',6,3.2,'BD · ERP'], ['dx','Direct Connect','red',6,4.4],
      ['erp','SAP (ERP)','cliente',7,4.4] ],
    edges: [['p','api'],['api','vl','integración privada'],['vl','nlb'],['nlb','st'],['nlb','pr'],['st','e1'],['e1','ddb'],['pr','db'],['sy','db'],['sy','e2'],['e2','sm'],['sy','vgw'],['vgw','dx'],['dx','erp'],['api','cw','',{dash:true}]],
    groups: [['AWS Cloud',1,0.4,6,4.4,'cloud'],['VPC',2,0.4,5,4.4,'vpc'],['Subnets privadas app (2 AZ)',2,0.6,4,3.2,'priv'],['Subnet privada datos',5,1.8,5,1.8,'priv'],['Datacenter',7,4.4,7,4.4,'onprem']] },
});

Object.assign(GRADING, {
  'stock-api': { conn: [
    { f:['actor'], t:['apigw','waf'], why:'Los partners llaman a API Gateway (con WAF).', src:'SV p.23 · fuera de las diapositivas' },
    { f:['apigw','waf'], t:['vpclink'], why:'API Gateway llega a la VPC por un VPC Link (integración privada).', src:'fuera de las diapositivas' },
    { f:['vpclink'], t:['nlb','alb'], why:'El VPC Link apunta a un balanceador interno (NLB en REST API).', src:'fuera de las diapositivas' },
    { f:['nlb','alb'], t:['ecs','fargate','ec2','eks'], min:2, why:'El balanceador reparte a los microservicios de stock y precios.', src:'CT p.11 · EV p.14' },
    { f:['ecs','fargate','ec2','vpce'], t:['dynamodb'], why:'Stock en DynamoDB (milisegundos).', src:'SV p.13' },
    { f:['ecs','fargate','ec2'], t:['rds','aurora'], why:'Precios en la base de datos relacional.', src:'BD p.15' },
    { f:['ecs','fargate','ec2','vpce'], t:['secrets'], why:'Credenciales de la BD y del ERP en Secrets Manager.', src:'fuera de las diapositivas' },
    { f:['ecs','fargate','ec2','vpn','dx'], t:['dx','vpn','actor'], why:'Sincronización con el SAP on-premise por Direct Connect.', src:'fuera de las diapositivas' },
  ], text: [
    { re:/api.?key|usage|cuota|throttl/i, why:'Indica las API keys y usage plans por partner.', src:'Requisito' },
    { re:/PK/i, why:'Indica la PK de la tabla DynamoDB.', src:'Se pide' },{ re:/SK/i, why:'Indica la SK de la tabla.', src:'Se pide' },
    { re:/interno|internal|privad/i, why:'Indica que el balanceador es interno.', src:'Requisito' },
  ], inside: [
    { types:['ecs','fargate','ec2','eks','rds','aurora'], kind:'priv', why:'Contenedores y BD en subnets privadas.' },
    { types:['nlb','alb'], kind:'priv', why:'El balanceador es INTERNO: va en subnets privadas (no hay ALB público).' },
    { types:['vpclink','vpce'], kind:'vpc', why:'VPC Link y endpoints dentro de la VPC.' },
    { types:['actor'], kind:'onprem', label:/sap|erp/i, why:'El SAP va on-premise.' },
  ]},
});
