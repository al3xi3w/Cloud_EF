/* Íconos oficiales de AWS (AWS Architecture Icons, versión 01/30/2026) en icons/aws/.
   Fuente: https://aws.amazon.com/architecture/icons/ (vía el paquete npm aws-icons, MIT). */
const ICON_DIR = 'icons/aws/';
const ICON_IDS = new Set(['lambda','fargate','ec2','asg','ecs','eks','ecr','apigw','appsync','eventbridge','sns','sqs','dlq','stepfunctions','kinesis','iotcore','ses','transfer','s3','efs','dynamodb','aurora','rdsproxy','rds','elasticache','opensearch','redshift','neptune','ebs','glacier','cloudwatch','cloudtrail','amplify','cognito','route53','cloudfront','rekognition','comprehend','textract','sagemaker','vpc','igw','nat','vpce','vgw','vpn','dx','alb','nlb','vpclink','waf','secrets','kms','iam']);

/* Actor (persona, dispositivo o sistema externo) según su nombre */
function actorIcon(label) {
  const l = String(label);
  if (/sensor|cami[oó]n|tractor|\biot\b|mqtt|dispositivo/i.test(l)) return 'u-sensor';
  if (/\bcore\b|\bsap\b|\berp\b|\bhis\b|\blis\b|oracle|datacenter|estadio|control de acceso|contable|financiero|hospital|laboratorio|\bcce\b|servidor/i.test(l)) return 'u-server';
  if (/\bapi\b|pasarela|\bose\b|sunat|tercero|banco|riesgo|antifraude|recaudaci/i.test(l)) return 'u-app';
  if (/app|m[oó]vil|tablet|celular/i.test(l)) return 'u-mobile';
  if (/\bweb\b|navegador|portal/i.test(l)) return 'u-client';
  if (/usuarios|amigos|clientes \d/i.test(l)) return 'u-users';
  return 'u-user';
}

/* Diagramas de ejemplo: el ícono se deduce del nombre de la caja (primera regla que coincide) */
const LABEL_ICON_RULES = [
  [/^λ|lambda|^(add|complete|delete|getAll|get|update)Todo$|Extract Text|Split files|^Analyze$|Add to SQS|Get file|Process files|Aggregate|Delete intermediate/i, 'lambda'],
  [/step functions|wait 10/i, 'stepfunctions'],
  [/api gateway|todo api/i, 'apigw'],
  [/vpc link/i, 'vpclink'],
  [/vpc endpoint/i, 'vpce'],
  [/nat gateway/i, 'nat'],
  [/internet gateway/i, 'igw'],
  [/virtual private gateway/i, 'vgw'],
  [/direct connect/i, 'dx'],
  [/\bVPN\b/, 'vpn'],
  [/load balancer/i, 'alb'],
  [/\bALB\b/, 'alb'],
  [/\bNLB\b/, 'nlb'],
  [/cloudfront/i, 'cloudfront'],
  [/eventbridge|scheduler|event router|broker|bus de eventos|routing/i, 'eventbridge'],
  [/dead letter/i, 'dlq'],
  [/\bSNS\b/, 'sns'],
  [/\bSQS\b|\bqueue\b/i, 'sqs'],
  [/kinesis/i, 'kinesis'],
  [/iot core/i, 'iotcore'],
  [/\bSES\b/, 'ses'],
  [/transfer family/i, 'transfer'],
  [/dynamodb|items table/i, 'dynamodb'],
  [/aurora/i, 'aurora'],
  [/elasticache/i, 'elasticache'],
  [/opensearch|elasticsearch/i, 'opensearch'],
  [/\bS3\b|bucket|OpenAQ|results \(S3\)/i, 's3'],
  [/cloudwatch|alarm/i, 'cloudwatch'],
  [/\bDB\b|schema/i, 'rds'],
  [/cloudtrail/i, 'cloudtrail'],
  [/cognito/i, 'cognito'],
  [/route 53/i, 'route53'],
  [/amplify/i, 'amplify'],
  [/\bWAF\b/, 'waf'],
  [/secrets manager/i, 'secrets'],
  [/\bKMS\b/, 'kms'],
  [/rekognition/i, 'rekognition'],
  [/comprehend/i, 'comprehend'],
  [/textract/i, 'textract'],
  [/sagemaker/i, 'sagemaker'],
  [/\bECS\b|fargate|^worker/i, 'ecs'],
  [/\bEC2\b/, 'ec2'],
];
function labelIcon(label, cat) {
  for (const [re, id] of LABEL_ICON_RULES) if (re.test(label)) return id;
  if (cat === 'cliente') return actorIcon(label);
  if (cat === 'monitoreo') return 'cloudwatch';
  if (cat === 'computo') return 'u-app';
  return null;
}
const iconFor = (type, label) => type === 'actor' ? actorIcon(label) : (ICON_IDS.has(type) ? type : null);
const iconUrl = id => id ? ICON_DIR + id + '.svg' : null;

/* Ícono para insertar en un SVG: fondo blanco redondeado (para que se vea en modo oscuro) + imagen */
function iconSvg(id, x, y, size) {
  if (!id) return '';
  return `<rect x="${x - 2}" y="${y - 2}" width="${size + 4}" height="${size + 4}" rx="${size * 0.18}" style="fill:#fff"/><image href="${iconUrl(id)}" x="${x}" y="${y}" width="${size}" height="${size}" style="pointer-events:none"/>`;
}
/* Ícono para HTML (catálogo, paleta, guía) */
const iconImg = (id, cls = 'ic') => id ? `<img class="${cls}" src="${iconUrl(id)}" alt="" loading="lazy">` : '';

/* Tamaño de letra para que una línea quepa en el ancho disponible */
const fitFont = (line, avail, base) => Math.max(base * 0.62, Math.min(base, avail / (String(line).length * 0.6)));
/* Con el ícono de Lambda, el prefijo “λ ” sobra */
const dropLambda = (label, ic) => ic === 'lambda' ? String(label).replace(/^λ\s*/, '') : label;
