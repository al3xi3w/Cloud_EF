/* Clases nuevas: Virtualización con Máquinas Virtuales (Semana 2) y Contenedores (Semana 3).
   Todo sale de las diapositivas:
   VM = Clases/1. Virtualización con Máq. Vir. V1.50.pdf · CT = Clases/1. Contenedores - Teoría 1 - V1.00.pdf */

Object.assign(DECKS, {
  VM: { name: 'Virtualización con Máquinas Virtuales', week: 'Semana 2', file: 'Clases/1. Virtualización con Máq. Vir. V1.50.pdf' },
  CT: { name: 'Virtualización con contenedores – Teoría 1', week: 'Semana 3', file: 'Clases/1. Contenedores - Teoría 1 - V1.00.pdf' },
});

/* Precios que muestran las diapositivas (EE.UU. Este – Ohio, Linux, bajo demanda) */
const EC2_PRECIOS = [['t3.nano', 2, '0,5', 0.0052], ['t3.micro', 2, '1', 0.0104], ['t3.small', 2, '2', 0.0208], ['t3.medium', 2, '4', 0.0416], ['t3.large', 2, '8', 0.0832], ['t3.xlarge', 4, '16', 0.1664], ['t3.2xlarge', 8, '32', 0.3328]];
const EBS_PRECIOS = [['gp3', 'SSD de uso general (gp3)', 0.08], ['gp2', 'SSD de uso general (gp2)', 0.10], ['io2', 'SSD de IOPS provisionadas (io2)', 0.125]];

const stack = (layers, title) => `<div class="stk"><b>${title}</b>${layers.map(([t, c, n]) => `<div class="stk-row" style="--c:${c}">${n ? Array.from({ length: n }, () => `<span>${t}</span>`).join('') : `<span class="w">${t}</span>`}</div>`).join('')}</div>`;

LESSONS.unshift(
{ id:'vm', deck:'VM', title:'Virtualización con Máquinas Virtuales', short:'Servidor, hipervisor tipo 1 y tipo 2, qué es una VM (instancia) y cómo se cobra en AWS: compute, storage y data out.',
  html: `
<h2>1. Desde cero: servidor y virtualización</h2>
<p>La virtualización es la <b>tecnología fundamental para crear infraestructura en la nube</b>: permite dividir un servidor físico grande en muchas máquinas virtuales más pequeñas, y cada cliente usa la suya.</p>
<div class="src">VM p.3</div>
<h3>Servidor</h3>
<ul><li>Es un <b>hardware más potente que una computadora personal</b> (más CPUs, GPUs, RAM, disco).</li>
<li><b>Provee servicios</b> a otras computadoras “clientes”.</li>
<li>Requiere un <b>sistema operativo para servidor</b> donde se pueda <b>virtualizar el HW en partes más pequeñas (máquinas virtuales)</b>.</li></ul>
<div class="src">VM p.5</div>

<h3>Las dos formas de virtualizar el hardware de un servidor</h3>
<p><b>VM = Virtual Machine (Máquina Virtual)</b>. En el diagrama de clase, cada VM (o <i>instance</i>) tiene su <b>Application</b>, su propio <b>Guest OS</b> y su <b>Virtual Hardware</b>. Lo que cambia es dónde corre el <b>hipervisor</b>:</p>
<div class="two">
<div class="card"><b>① El hipervisor se instala directamente sobre el hardware</b>
${stack([['Application','#4dabf7',3],['Guest OS','#e03131',3],['Virtual Hardware','#94d82d',3],['Hypervisor','var(--accent)'],['Physical Hardware (CPU · RAM · Disk · NIC)','var(--muted)']], 'VM / Instance ×3')}
<p>Ejemplos de la diapositiva: <b>VMware ESXi</b> y <b>Microsoft Hyper-V</b> (hipervisor). Linux aparece como <i>Guest OS</i>.</p></div>
<div class="card"><b>② El hipervisor se ejecuta en un sistema operativo host</b>
${stack([['Application','#4dabf7',3],['Guest OS','#e03131',3],['Virtual Hardware','#94d82d',3],['Hypervisor','var(--accent)'],['Host Operating System','#f08c00'],['Physical Hardware (CPU · RAM · Disk · NIC)','var(--muted)']], 'VM / Instance ×3')}
<p>Ejemplos de la diapositiva: <b>VMware Workstation</b> y <b>Oracle VM VirtualBox</b> (hipervisor) sobre un <b>Host OS</b> como <b>Ubuntu Server</b>.</p></div>
</div>
<div class="src">VM p.6</div>

<h2>2. Modelo de precios de una máquina virtual en AWS</h2>
<ul><li>AWS ofrece <b>pago por uso</b> en el precio de más de 160 servicios en la nube.</li>
<li>Solo pagas por los servicios que necesitas <b>durante el tiempo que los utilices</b>, sin contratos a largo plazo ni licencias complejas.</li>
<li>Una vez que cancelas el servicio, <b>no se aplican costos adicionales ni cuotas de cancelación</b>.</li></ul>
<div class="note">👉 Para una máquina virtual en AWS solo se paga por <b>3 componentes</b>: <b>① Compute</b> (CPU, memoria RAM), <b>② Storage</b> (almacenamiento: disco) y <b>③ Data Out</b> (transferencia de datos saliente).</div>
<div class="src">VM p.8</div>

<h3>① Compute: instancias EC2</h3>
<p>En AWS, <b>a una máquina virtual se le llama instancia</b> (servicio <b>EC2</b>). Hay <b>cinco modelos de compra</b> de instancias:</p>
<ol class="steps"><li><b>Bajo demanda</b>: el más utilizado y el que se usa en el curso.</li><li><b>Savings Plans</b> (planes de ahorro)</li><li><b>Instancias reservadas</b></li><li><b>Instancias de spot</b></li><li><b>Alojamientos dedicados</b>: instancias EC2 en servidores físicos exclusivos.</li></ol>
<div class="src">VM p.9</div>
<p><b>Bajo demanda</b>: pagas la capacidad informática <b>por hora o por segundo (mínimo 60 segundos)</b>, puedes aumentar o reducir la capacidad según tu aplicación y no te comprometes a largo plazo. Así se eliminan los costos de planificar, comprar y mantener hardware: <b>grandes costos fijos se transforman en costos variables mucho más reducidos</b>.</p>
<div class="src">VM p.10</div>
<p>Los precios bajo demanda <b>varían según la región y el sistema operativo</b>. Ejemplo de la clase (Linux, EE.UU. Este – Ohio, uso general):</p>
<div class="tablewrap"><table><tr><th>Instancia</th><th>CPU virtual</th><th>Memoria</th><th>Linux (USD por hora)</th></tr>
${EC2_PRECIOS.map(([n, c, m, p]) => `<tr><td>${n}</td><td>${c}</td><td>${m} GiB</td><td>${String(p).replace('.', ',')}</td></tr>`).join('')}</table></div>
<p><b>Ejemplo de clase:</b> una <b>t3.micro</b> (2 CPU, 1 GB RAM) a US$ 0,0104 por hora cuesta <b>US$ 7,49 al mes</b> (24 horas × 30 días = 720 h × 0,0104).</p>
<div class="src">VM p.11</div>

<h3>② Storage: volúmenes EBS</h3>
<p>Las instancias usan el servicio <b>EBS</b> para almacenamiento. El precio varía según la región y el tipo de volumen. En Ohio: gp3 = 0,08 USD/GB-mes, gp2 = 0,10 USD/GB-mes, io2 = 0,125 USD/GB-mes.</p>
<p><b>Ejemplo de clase:</b> <b>20 GB de SSD gp3 cuestan US$ 1,6 al mes</b> (20 × 0,08), que se suman al costo mensual de la instancia.</p>
<div class="src">VM p.12</div>

<h3>③ Data Out: transferencia de datos saliente</h3>
<ul><li>La transferencia <b>entrante</b> desde internet hacia EC2 es <b>gratis</b>.</li>
<li>La transferencia <b>saliente</b> de EC2 hacia internet tiene un <b>costo escalonado</b>. Ejemplo: un servidor web en la instancia que sirve páginas a computadoras en internet.</li>
<li>Tabla de la clase (Ohio): los clientes de AWS reciben <b>100 GB gratis al mes</b> de transferencia a internet (en total, sumando todos los servicios y regiones). Después: primeros 10 TB/mes a 0,09 USD/GB, siguientes 40 TB a 0,085, siguientes 100 TB a 0,07 y más de 150 TB a 0,05.</li></ul>
<div class="src">VM p.13</div>

<h3>Calculadora (solo con los precios de las diapositivas)</h3>
<div id="ec2calc" class="card"></div>

<h2>3. Ejercicio de clase</h2>
<div class="card">Ingresa a <code>aws.amazon.com/es/ec2/pricing/on-demand/</code> e identifica el precio de <b>Compute</b> de 3 máquinas virtuales en la región <b>EE.UU. Este (Norte de Virginia)</b>, con <b>Linux</b> y tipo de instancia <b>Uso general</b>:
<ul><li>Pequeña: 1 vCPU y 2 GB de RAM</li><li>Mediana: 2 vCPU y 4 GB de RAM</li><li>Grande: 4 vCPU y 16 GB de RAM</li></ul>Analiza y debate en clase.</div>
<div class="src">VM p.15</div>
<div class="note">La diapositiva no da los precios de Norte de Virginia: hay que buscarlos en la página de AWS. Con la tabla de Ohio de la clase, las instancias equivalentes serían t3.small (2 GiB, aunque con 2 vCPU), t3.medium (2 vCPU, 4 GiB) y t3.xlarge (4 vCPU, 16 GiB).</div>

<h2>4. Preguntas de cierre del profesor</h2>
<ul><li>¿Para qué sirve la virtualización?</li><li>¿Qué es una Máquina Virtual?</li><li>¿Cuáles son los 3 componentes de precio de una Máquina Virtual?</li></ul>
`},
{ id:'contenedores', deck:'CT', title:'Virtualización con contenedores', short:'Qué problema resuelven (transporte de software), qué es un contenedor y cómo se implementa con Docker y Docker Compose.',
  html: `
<h2>1. La problemática: el transporte</h2>
<h3>Transporte de mercancías</h3>
<p>“<b>Contenedor, la caja que cambió el transporte de mercancías</b>”: en 1966 se hizo el primer recorrido transatlántico con 228 contenedores. El contenedor es:</p>
<ul><li><b>Estándar</b></li><li>De <b>contenido diferente</b></li><li><b>Transportable</b> de un lugar a otro</li><li><b>Automatizable</b> (grúa de carga y descarga)</li></ul>
<div class="src">CT p.5–6</div>

<h3>Transporte de software (SW)</h3>
<p>Transporte = “trasladar algo de un lugar a otro”. Con el software pasa lo mismo: el programa viaja del <b>ambiente local</b> del programador al <b>ambiente de Desarrollo</b>, luego a <b>Pruebas</b> y luego a <b>Producción</b>.</p>
<p><b>El problema:</b> en su ambiente local, el Programador 1 tiene <i>SW 1 + Configuración 1 + Librerías 1</i> y todo funciona ✅. Al llevarlo al ambiente de Desarrollo, ese ambiente tiene <i>Configuración 1’</i> y <i>Librerías 1’’</i>, que son distintas, y falla ❌. Lo mismo le pasa al Programador 2 con su SW 2.</p>
<div class="src">CT p.7</div>
<h3>La solución</h3>
<p>Se transporta el software <b>dentro de un contenedor</b> que lleva consigo sus dependencias exactas. Así funciona igual en todos los ambientes:</p>
<div class="tablewrap"><table><tr><th>Contenedor</th><th>Contenido</th><th>Ambiente local → Desarrollo → Pruebas → Producción</th></tr>
<tr><td>Registro cita</td><td>node.js 16.15.1 · sqlite 3.39.0</td><td>✅ funciona igual en todos</td></tr>
<tr><td>Registro medicinas</td><td>node.js 18.4.0 · sqlite 3.39.0</td><td>✅ funciona igual en todos</td></tr></table></div>
<p>Fíjate en que cada aplicación usa su <b>propia versión de node.js</b> (16.15.1 y 18.4.0) y no chocan, porque cada una va en su contenedor.</p>
<div class="src">CT p.9</div>

<h2>2. Conceptos</h2>
<div class="quote">“Contiene todo lo que necesita una aplicación de SW para funcionar.”<br>“Cada contenedor debe hacer una cosa y hacerlo bien.”</div>
<div class="src">CT p.11 (docs.docker.com)</div>

<h3>Implementación con Docker</h3>
{{dia:docker}}
<ol class="steps"><li><b>Dockerfile (texto)</b>: describe la aplicación y sus dependencias (Registro cita, node.js 16.15.1, sqlite 3.39.0).</li>
<li>Comando <b>build</b> → genera la <b>Docker image (binario)</b>.</li>
<li>Comando <b>share</b> → la imagen se publica en un <b>Docker Registry</b> (ej. <code>hub.docker.com</code>).</li>
<li>Comando <b>run</b> → la imagen se ejecuta como contenedor sobre <b>Docker (container engine)</b>, que corre sobre el <b>Host OS Kernel</b>.</li></ol>
<div class="src">CT p.12</div>

<h3>Aplicaciones multi-contenedor: Docker Compose</h3>
<p>Un <b>Docker Compose file</b> (texto <b>.yml</b> estándar) describe <b>varias</b> aplicaciones a la vez. Con <b>build</b> se generan sus imágenes y con <b>run</b> se ejecutan todas en el mismo Docker engine.</p>
{{dia:compose}}
<div class="src">CT p.13</div>

<h3>Máquina virtual vs contenedor (comparando los diagramas de las dos clases)</h3>
<div class="tablewrap"><table><tr><th></th><th>Máquina virtual (VM p.6)</th><th>Contenedor (CT p.12–13)</th></tr>
<tr><td>Qué virtualiza</td><td>El <b>hardware</b>: cada VM tiene su Virtual Hardware</td><td>La <b>aplicación con sus dependencias</b></td></tr>
<tr><td>Sistema operativo</td><td>Cada VM tiene su propio <b>Guest OS</b></td><td>Todos los contenedores comparten el <b>Host OS Kernel</b></td></tr>
<tr><td>Quién los ejecuta</td><td>El <b>hipervisor</b> (ESXi, Hyper-V, VirtualBox…)</td><td>El <b>container engine</b> (Docker)</td></tr>
<tr><td>Cómo se describe</td><td>—</td><td>Dockerfile / Docker Compose (.yml)</td></tr></table></div>
<div class="note design"><span class="tag design">comparación armada por nosotros</span> Las diapositivas no tienen una tabla “VM vs contenedor” (es el tema 6.3.4 del sílabo). Esta tabla sale de comparar los dos diagramas de clase. En el sílabo también aparecen “ventajas” (por ejemplo, que los contenedores son más livianos), pero eso no está en las diapositivas.</div>

<h2>3. Ejercicio de clase: analogía de contenedores</h2>
<p>Relaciona cada característica del transporte de mercancías con su equivalente en el transporte de software:</p>
<div class="tablewrap"><table><tr><th>Transporte de mercancías</th><th>Transporte de software</th></tr>
<tr><td><b>Estándar</b></td><td>c) <b>Dockerfile</b> (texto) y <b>Docker Compose file</b> (texto .yml estándar)</td></tr>
<tr><td><b>Contenido</b> diferente</td><td>a) Las <b>imágenes</b>: Registro cita (node 16.15.1) y Registro medicinas (node 18.4.0)</td></tr>
<tr><td><b>Transportable</b> de un lugar a otro</td><td>d) <b>Ambiente local → Desarrollo → Pruebas → Producción</b></td></tr>
<tr><td><b>Automatizable</b> (grúa de carga y descarga)</td><td>b) Los comandos <b>build</b> y <b>run</b></td></tr></table></div>
<div class="src">CT p.15 (respuestas según las flechas de la diapositiva)</div>

<h2>4. Preguntas de cierre del profesor</h2>
<ul><li>¿Qué es un contenedor? → “Contiene todo lo que necesita una aplicación de SW para funcionar”.</li><li>¿Qué problema resuelve? → El <b>transporte de SW (despliegue)</b>.</li><li>¿Con qué herramienta de SW se puede implementar? → <b>docker</b>.</li></ul>
<div class="src">CT p.17</div>
<div class="note">En AWS, los contenedores se ejecutan con servicios como <b>ECS</b>, <b>EKS</b> o <b>Fargate</b> (SV p.11). Míralos en la pestaña <a href="#/servicios">Servicios</a>.</div>
`},
);

Object.assign(DIAGRAMS, {
  docker: { cw: 200, nodes: [['df','Dockerfile (texto)','web',0,0,'Registro cita · node 16.15.1 · sqlite 3.39.0'],['img','Docker image (binario)','datos',1,0],['reg','Docker Registry','integracion',1,1.3,'ej. hub.docker.com'],['run','Contenedor en ejecución','computo',2,0,'Docker engine · Host OS Kernel']],
    edges: [['df','img','build'],['img','reg','share'],['img','run','run']] },
  compose: { cw: 200, nodes: [['dc','Docker Compose file','web',0,0.5,'texto .yml estándar'],['i1','Imagen: Registro cita','datos',1,0,'node.js 16.15.1'],['i2','Imagen: Registro medicinas','datos',1,1,'node.js 18.4.0'],['c1','Contenedor Registro cita','computo',2,0],['c2','Contenedor Registro medicinas','computo',2,1]],
    edges: [['dc','i1','build'],['dc','i2','build'],['i1','c1','run'],['i2','c2','run']], groups: [['Docker engine (Host OS Kernel)',2,0,2,1]] },
});

/* Calculadora de costo mensual de una VM con los precios de VM p.11–13 */
function initEc2Calc() {
  const el = document.getElementById('ec2calc'); if (!el) return;
  el.innerHTML = `<div class="row" style="gap:14px">
    <label>Instancia (Ohio, Linux)<br><select id="cc-i">${EC2_PRECIOS.map(([n, c, m, p], i) => `<option value="${i}" ${n === 't3.micro' ? 'selected' : ''}>${n} · ${c} vCPU · ${m} GiB · $${p}/h</option>`).join('')}</select></label>
    <label>Horas al mes<br><input id="cc-h" type="number" value="720" min="0" style="width:90px"></label>
    <label>Disco EBS (GB)<br><input id="cc-g" type="number" value="20" min="0" style="width:80px"></label>
    <label>Tipo EBS<br><select id="cc-t">${EBS_PRECIOS.map(([k, n, p], i) => `<option value="${i}">${k} · $${p}/GB-mes</option>`).join('')}</select></label>
    <label>Data Out (GB/mes)<br><input id="cc-d" type="number" value="0" min="0" style="width:90px"></label></div>
    <div id="cc-r" class="exp" style="margin-top:10px"></div>`;
  const $c = id => document.getElementById(id);
  const calc = () => {
    const [n, , , ph] = EC2_PRECIOS[+$c('cc-i').value], h = +$c('cc-h').value || 0, g = +$c('cc-g').value || 0, [tk, , pg] = EBS_PRECIOS[+$c('cc-t').value], d = +$c('cc-d').value || 0;
    const comp = ph * h, sto = g * pg, out = Math.max(0, d - 100) * 0.09, tot = comp + sto + out;
    $c('cc-r').innerHTML = `① Compute: ${h} h × $${ph} = <b>$${comp.toFixed(2)}</b><br>② Storage: ${g} GB × $${pg} (${tk}) = <b>$${sto.toFixed(2)}</b><br>③ Data Out: ${d} GB − 100 GB gratis = ${Math.max(0, d - 100)} GB × $0,09 = <b>$${out.toFixed(2)}</b> <small>(tramo de los primeros 10 TB)</small><br><span class="score">Total ≈ $${tot.toFixed(2)} al mes</span>`;
  };
  el.querySelectorAll('select,input').forEach(x => x.addEventListener('input', calc)); calc();
}

/* Catálogo: EC2 ahora sí está en clase; EBS es nuevo */
Object.assign(SVC.ec2, { fuera: undefined, src: 'VM p.9–13 · MO p.10',
  que: '“Una máquina virtual se le llama <b>instancia</b> en AWS.” Eliges el tipo de instancia (vCPU y memoria). El precio varía según la <b>región</b> y el <b>sistema operativo</b>. Se paga por <b>compute</b> (CPU, RAM), <b>storage</b> (EBS) y <b>data out</b>.',
  cuando: ['<b>Bajo demanda</b>: pagas por hora o por segundo (mínimo 60 s) sin compromiso; es el modelo que se usa en el curso. Otros modelos: Savings Plans, reservadas, spot y alojamientos dedicados (VM p.9–10).', 'Cuando necesitas una máquina completa con su sistema operativo, o procesos de más de 15 minutos (el límite de Lambda, LM p.8).', '<span class="tag warn">fuera de las diapositivas</span> En arquitecturas: instancias en <b>subnets privadas</b>, detrás de un <b>ALB</b>, dentro de un <b>Auto Scaling group</b> en 2 AZ.'],
  datos: ['t3.micro (2 vCPU, 1 GiB) en Ohio con Linux = US$ 0,0104/h ≈ <b>US$ 7,49 al mes</b> (VM p.11).', 'Transferencia entrante desde internet: gratis. Saliente: escalonada, desde 0,09 USD/GB, con 100 GB gratis al mes (VM p.13).'],
  ejemplos: ['Ejercicio de precios Compute: pequeña, mediana y grande (VM p.15)', 'CloudWatch puede iniciar EC2 Auto Scaling o detener una instancia (MO p.10)'] });
SERVICES.push({ id:'ebs', name:'Amazon EBS', cat:'datos',
  que:'El servicio que usan las instancias EC2 para <b>almacenamiento</b> (sus discos). El precio varía según la región y el tipo de volumen.',
  src:'VM p.12',
  cuando:['Es el disco de cada máquina virtual.','Se paga por GB-mes: gp3 a 0,08 USD (20 GB = US$ 1,6/mes), gp2 a 0,10 e io2 a 0,125 (Ohio).'],
  ejemplos:['Storage: componente ② del precio de una VM (VM p.12)'] });
Object.assign(SVC, Object.fromEntries(SERVICES.map(s => [s.id, s])));
Object.assign(SVC.ecs, { src: 'SV p.11 · CT (contenedores Docker)' });

/* Preguntas */
Object.assign(TOPIC_NAMES, { vm: 'Máquinas virtuales', contenedores: 'Contenedores' });
const NEWQ = [
{ t:'vm', q:'¿Qué es un servidor, según la clase?', o:['Un hardware más potente que una PC que provee servicios a otras computadoras “clientes”','Un programa que se instala en la PC del usuario','Una base de datos en la nube','Un contenedor de Docker'], a:0, exp:'“Es un hardware más potente que una computadora personal (más CPUs, GPUs, RAM, disco). Provee servicios a otras computadoras clientes.”', src:'VM p.5' },
{ t:'vm', q:'¿Para qué necesita el servidor un sistema operativo para servidor, según la clase?', o:['Para virtualizar el hardware en partes más pequeñas (máquinas virtuales)','Para navegar por internet','Para compilar contenedores','Para reemplazar al hipervisor'], a:0, exp:'“Requiere un Sistema Operativo para servidor donde se pueda virtualizar el HW en partes más pequeñas (máquinas virtuales).”', src:'VM p.5' },
{ t:'vm', q:'En la forma ① de virtualizar, el hipervisor…', o:['se instala directamente sobre el hardware','se ejecuta sobre un sistema operativo host','corre dentro de cada Guest OS','no existe'], a:0, exp:'① “El software del hipervisor se instala directamente sobre el hardware.” ② “se ejecuta en un sistema operativo host.”', src:'VM p.6' },
{ t:'vm', q:'¿Cuál de estos hipervisores se ejecuta sobre un sistema operativo host (forma ②), según la diapositiva?', o:['Oracle VM VirtualBox','VMware ESXi','Microsoft Hyper-V','Docker'], a:0, exp:'En la diapositiva, VMware Workstation y VirtualBox apuntan al hipervisor de la forma ② (sobre un Host OS como Ubuntu Server). ESXi y Hyper-V apuntan a la forma ①.', src:'VM p.6' },
{ t:'vm', q:'¿Qué capas tiene cada VM en el diagrama de clase?', o:['Application, Guest OS y Virtual Hardware','Solo Application','Application y Host OS Kernel','Dockerfile e imagen'], a:0, exp:'Cada “VM / Instance” tiene Application, Guest OS y Virtual Hardware, sobre el hipervisor.', src:'VM p.6' },
{ t:'vm', q:'¿Cuáles son los 3 componentes por los que se paga una máquina virtual en AWS?', o:['Compute (CPU, RAM), Storage (disco) y Data Out (transferencia saliente)','CPU, licencia y soporte','Compute, Data In y cuota de cancelación','Solo las horas de uso'], a:0, exp:'“Para máquina virtual en AWS sólo se paga por: Compute, Storage, Data Out.”', src:'VM p.8' },
{ t:'vm', q:'¿Cómo se le llama a una máquina virtual en AWS?', o:['Instancia','Contenedor','Función','Bucket'], a:0, exp:'“Una máquina virtual se le llama instancia en AWS.”', src:'VM p.9' },
{ t:'vm', q:'¿Cuál es el modelo de compra de instancias más utilizado y el que se usa en el curso?', o:['Bajo demanda','Instancias de spot','Alojamientos dedicados','Instancias reservadas'], a:0, exp:'“El modelo de compra Bajo demanda es el más utilizado y es el que usaremos en el curso.”', src:'VM p.9' },
{ t:'vm', q:'¿Cuál NO es uno de los cinco modelos de compra de instancias EC2?', o:['Instancias serverless','Savings Plans','Instancias de spot','Alojamientos dedicados'], a:0, exp:'Los cinco son: bajo demanda, Savings Plans, instancias reservadas, instancias de spot y alojamientos dedicados.', src:'VM p.9' },
{ t:'vm', q:'En el modelo bajo demanda, ¿cuál es el cobro mínimo cuando se paga por segundo?', o:['60 segundos','1 hora','1 día','No hay mínimo'], a:0, exp:'“…puede pagar por capacidad de cómputo por hora o segundo (mínimo de 60 segundos)…”', src:'VM p.10' },
{ t:'vm', q:'Según la clase, ¿cuánto cuesta al mes una t3.micro (Linux, Ohio, US$ 0,0104/h) encendida 24 × 30?', o:['US$ 7,49','US$ 0,25','US$ 74,90','US$ 1,60'], a:0, exp:'720 h × 0,0104 = 7,488 ≈ US$ 7,49 al mes.', src:'VM p.11' },
{ t:'vm', q:'¿De qué depende el precio bajo demanda de una instancia, además del tipo de instancia?', o:['De la región y del sistema operativo','Solo del color del panel','De la cantidad de usuarios registrados','De nada más'], a:0, exp:'“Los precios de las instancias Bajo demanda varían según la región… Además, varían según el sistema operativo.”', src:'VM p.11' },
{ t:'vm', q:'¿Qué servicio usan las instancias EC2 para almacenamiento y cuánto cuestan 20 GB de gp3 en el ejemplo de clase?', o:['EBS; US$ 1,6 al mes','S3; US$ 20 al mes','DynamoDB; gratis','EFS; US$ 0,08 al mes'], a:0, exp:'“Las instancias utilizan el servicio EBS para almacenamiento… 20 GB de SSD de uso general (gp3) cuesta US$ 1.6 al mes.”', src:'VM p.12' },
{ t:'vm', q:'¿Cuánto cuesta la transferencia de datos ENTRANTE desde internet hacia EC2?', o:['Es gratis','0,09 USD/GB','0,05 USD/GB','Depende del sistema operativo'], a:0, exp:'“Transferencia de datos entrante desde internet hacia instancias EC2 es gratis.” La saliente tiene un costo escalonado.', src:'VM p.13' },
{ t:'contenedores', q:'¿Qué es un contenedor, según la clase?', o:['Algo que contiene todo lo que necesita una aplicación de SW para funcionar','Una máquina virtual con su propio Guest OS','Un tipo de base de datos','Un servidor físico'], a:0, exp:'“Contiene todo lo que necesita una aplicación de SW para funcionar.”', src:'CT p.11' },
{ t:'contenedores', q:'Según la clase, cada contenedor debe…', o:['hacer una cosa y hacerlo bien','contener todas las aplicaciones de la empresa','tener su propio hipervisor','ejecutarse solo en producción'], a:0, exp:'“Cada contenedor debe hacer una cosa y hacerlo bien.”', src:'CT p.11' },
{ t:'contenedores', q:'¿Qué problema resuelven los contenedores?', o:['El transporte de SW (despliegue) entre ambientes sin que cambien configuraciones ni librerías','El costo de la transferencia de datos','La autenticación de usuarios','El cold start de Lambda'], a:0, exp:'El software que funciona en el ambiente local falla en Desarrollo por tener Configuración 1’ y Librerías 1’’ distintas. El contenedor resuelve el transporte de SW (despliegue).', src:'CT p.7, p.9, p.17' },
{ t:'contenedores', q:'¿Con qué herramienta de software se implementan los contenedores en la clase?', o:['docker','VirtualBox','VMware ESXi','Hyper-V'], a:0, exp:'“¿Con qué herramienta de SW se puede implementar? docker.”', src:'CT p.17' },
{ t:'contenedores', q:'¿Qué comando convierte un Dockerfile (texto) en una Docker image (binario)?', o:['build','run','share','compose'], a:0, exp:'Dockerfile → comando build → Docker image → comando run → contenedor.', src:'CT p.12' },
{ t:'contenedores', q:'¿Qué hace el comando run?', o:['Ejecuta la imagen como contenedor sobre el Docker engine','Crea el Dockerfile','Publica la imagen en el registry','Borra la imagen'], a:0, exp:'La imagen se ejecuta (run) sobre Docker (container engine), que corre sobre el Host OS Kernel.', src:'CT p.12' },
{ t:'contenedores', q:'¿Dónde se comparten (share) las imágenes Docker?', o:['En un Docker Registry, por ejemplo hub.docker.com','En el Guest OS','En un hipervisor','En el Dockerfile'], a:0, exp:'Docker image → share → Docker Registry (ej. hub.docker.com).', src:'CT p.12' },
{ t:'contenedores', q:'¿Qué archivo describe una aplicación multi-contenedor?', o:['Docker Compose file (texto .yml estándar)','Un Dockerfile binario','Una AMI','Un archivo .exe'], a:0, exp:'“Docker Compose file (texto .yml estándar)” para aplicaciones multi contenedor.', src:'CT p.13' },
{ t:'contenedores', q:'Según los diagramas de clase, ¿sobre qué corren los contenedores en el Docker engine?', o:['Sobre el Host OS Kernel (compartido)','Cada uno sobre su propio Guest OS','Sobre un hipervisor tipo 1','Sobre el Virtual Hardware de cada VM'], a:0, exp:'El diagrama muestra los contenedores sobre “Docker (Container engine)” con el “Host OS Kernel”. En cambio, cada VM tiene su propio Guest OS (VM p.6).', src:'CT p.12–13 · VM p.6' },
{ t:'contenedores', q:'En la analogía, ¿qué representa la característica “Estándar” de los contenedores de mercancías?', o:['El Dockerfile y el Docker Compose file','Los comandos build y run','Los ambientes Desarrollo, Pruebas y Producción','Las imágenes Registro cita y Registro medicinas'], a:0, exp:'Estándar → c) Dockerfile / Docker Compose file. Contenido diferente → a) las imágenes. Transportable → d) los ambientes. Automatizable → b) build y run.', src:'CT p.15' },
{ t:'contenedores', q:'En la analogía, ¿qué representa “Automatizable (grúa carga, descarga)”?', o:['Los comandos build y run','El Docker Compose file','Las imágenes','El ambiente local'], a:0, exp:'Automatizable → b) comandos build y run.', src:'CT p.15' },
{ t:'contenedores', q:'En el ejemplo de clase, ¿por qué “Registro cita” y “Registro medicinas” pueden convivir sin conflicto?', o:['Cada una va en su contenedor con su propia versión de node.js (16.15.1 y 18.4.0)','Porque usan el mismo node.js','Porque corren en distintos hipervisores','Porque no usan librerías'], a:0, exp:'Registro cita usa node.js 16.15.1 y Registro medicinas node.js 18.4.0, cada una en su propio contenedor.', src:'CT p.9, p.13' },
];
const q0 = QUESTIONS.length;
QUESTIONS.push(...NEWQ);
const NEWOPEN = [
{ t:'vm', q:'¿Para qué sirve la virtualización?', a:'Para <b>dividir el hardware de un servidor potente en partes más pequeñas (máquinas virtuales)</b>, cada una con su propio sistema operativo y aplicaciones. Es la <b>tecnología fundamental para crear infraestructura en la nube</b>: permite ofrecer a muchos clientes recursos sobre el mismo hardware. Se hace con un <b>hipervisor</b>, que va instalado directo sobre el hardware (ESXi, Hyper-V) o sobre un sistema operativo host (VirtualBox, VMware Workstation).', src:'VM p.3, p.5–6' },
{ t:'vm', q:'¿Qué es una Máquina Virtual?', a:'Es una parte del hardware de un servidor, <b>virtualizada por el hipervisor</b>, que funciona como una computadora independiente: tiene su <b>Virtual Hardware</b>, su <b>Guest OS</b> y sus <b>aplicaciones</b>. En AWS se le llama <b>instancia</b> (EC2).', src:'VM p.5–6, p.9' },
{ t:'vm', q:'¿Cuáles son los 3 componentes de precio de una Máquina Virtual?', a:'① <b>Compute</b> (CPU y memoria RAM): por hora o por segundo según el tipo de instancia, la región y el SO; por ejemplo, t3.micro a US$ 0,0104/h ≈ US$ 7,49/mes. ② <b>Storage</b> (disco EBS): por GB-mes; por ejemplo, 20 GB gp3 = US$ 1,6/mes. ③ <b>Data Out</b> (transferencia saliente a internet): escalonada; la entrante es gratis.', src:'VM p.8–13' },
{ t:'contenedores', q:'¿Qué es un contenedor?', a:'Es un paquete que <b>contiene todo lo que necesita una aplicación de software para funcionar</b>: el código, el runtime (por ejemplo, node.js 16.15.1) y las librerías (por ejemplo, sqlite 3.39.0). <b>Cada contenedor debe hacer una cosa y hacerlo bien.</b> Se ejecuta sobre un container engine (Docker) que comparte el kernel del sistema operativo host.', src:'CT p.11–12' },
{ t:'contenedores', q:'¿Qué problema resuelve un contenedor?', a:'El <b>transporte de software (despliegue)</b>: llevar una aplicación del ambiente local del programador a Desarrollo, Pruebas y Producción sin que falle por tener <b>configuraciones o librerías distintas</b> en cada ambiente. Como un contenedor de mercancías, es estándar, de contenido diferente, transportable y automatizable.', src:'CT p.5–9, p.17' },
{ t:'contenedores', q:'¿Con qué herramienta de software se puede implementar un contenedor?', a:'Con <b>docker</b>. Se escribe un <b>Dockerfile</b> (texto), se ejecuta <b>build</b> para crear la <b>imagen</b> (binario), se comparte (<b>share</b>) en un registry como hub.docker.com y se ejecuta con <b>run</b> sobre el Docker engine. Para varias aplicaciones se usa <b>Docker Compose</b> (archivo .yml).', src:'CT p.12–13, p.17' },
];
const o0 = OPEN.length;
OPEN.push(...NEWOPEN);
/* Repartir las nuevas preguntas entre los 3 simulacros, igual que las demás */
['vm', 'contenedores'].forEach(t => NEWQ.map((q, i) => [q, q0 + i]).filter(([q]) => q.t === t).forEach(([, idx], j) => EXAMS[j % 3].mcq.push(idx)));
EXAMS.forEach((e, k) => e.open.push(o0 + [2, 4, 5][k]));
