'use strict';
(function(){
const D=window.E2_MOTOR_DATA;
const calc=window.E2_ENGINE_CALC?.evaluate;
if(!D||!calc){console.error('No se pudo cargar el motor E2');return;}
const fmt=(n,dp=0)=>Number(n||0).toLocaleString('es-PE',{minimumFractionDigits:dp,maximumFractionDigits:dp});
const enc=s=>String(s??'').replace(/[&<>"']/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[a]));
let state={p:{...D.central},selection:null,ready:false};
const palette=['#d2a929','#377fa4','#59ad8b'];
const number=s=>Number(s)||0;
function side(){
 return `<div class="e2lab-side"><div class="eyebrow">ESTUDIO DE DEMANDA · E2</div><h1>Laboratorio económico</h1>
 <p class="e2lab-small">Mismo formato del visor E1. Motor económico único de 41 perfiles. Tarifas por servicio, gasto actual por concepto y beneficios sustituibles. No se fija un ticket.</p>
 <label>Ver distribución de</label><select id="e2Metric"><option value="ticket_usd_t">Ticket total (USD/t)</option><option value="ticket_importacion_usd_t">Ticket importación (USD/t)</option><option value="ticket_exportacion_usd_t">Ticket exportación (USD/t)</option><option value="toneladas">Captación (t/año)</option><option value="ingresos_usd">Ingresos brutos (USD/año)</option><option value="fraccion_margen_positivo">Volumen con beneficio usuario ≥ 0</option><option value="brecha_economica_media_usd_t">Ahorro adicional requerido (USD/t)</option></select>
 <label>Filtrar escenarios</label><select id="e2Filter"><option value="all">Todo el universo</option><option value="range">Ticket total entre 18 y 25 USD/t</option><option value="imp">Importación 18–25 USD/t</option><option value="exp">Exportación 18–25 USD/t</option><option value="pos">Beneficio del usuario ≥ 0 en ≥ 50 % de captación</option><option value="econ">Con al menos 1 t económicamente sustentada</option><option value="revenues">Ingresos ≥ US$ 5 millones</option></select>
 <label>Grupo estadístico</label><select id="e2Group"><option value="all">Todos</option><option value="0">Grupo 1</option><option value="1">Grupo 2</option><option value="2">Grupo 3</option></select>
 <details class="e2lab-note e2-tarifario-unico"><summary>Referencia tarifaria única · Porto Seco Cuiabá (fuentes y ciclos)</summary>
 <p class="e2lab-small">Benchmark de servicios, no tarifa oficial de Juliaca. El almacenaje ad valorem se calcula con tasas publicadas sobre <b>CIF proxy</b> (importación / tránsito) o <b>FOB proxy</b> (exportación). Los proxies comerciales E1 no equivalen a declaraciones CIF/FOB acreditadas.</p>
 <div id="e2TarifarioVivo" class="e2-tarifario-vivo" aria-live="polite">Se actualizarán los ciclos al recalcular.</div>
 <p class="e2lab-small"><b>Aplicación restringida:</b> el 0,15 % de control de carga y los recargos +20 %, +50 %, +90 % y +100 % constan en Cuiabá, <b>pero no forman parte del escenario central</b> sin identificación del servicio o de la mercancía habilitada. La segunda manipulación de importaciones es una hipótesis operacional separada.</p>
 <p class="e2lab-small"><a href="https://portoseco.com/storage/pricetable/176123226268fa458652d23.pdf" target="_blank" rel="noopener noreferrer">Tarifario importación</a> · <a href="https://portoseco.com/storage/pricetable/176123225168fa457b67030.pdf" target="_blank" rel="noopener noreferrer">Tarifario exportación</a> · <a href="e2/tarifas/tarifario_unico_cuiaba.json" target="_blank" rel="noopener noreferrer">Ficha tarifaria auditable</a></p></details>
 <div class="e2lab-note"><b>Configuraciones operativas</b><p class="e2lab-small">Cada botón modifica varios supuestos visibles; es una sensibilidad, no una predicción contratada.</p><button id="e2PresetDown">Conservador</button> <button id="e2PresetBase">Intermedio</button> <button id="e2PresetUp">Integración operativa</button></div><div id="e2RadarHost"></div><details open><summary>Parámetros editables del motor (${D.variables.length})</summary><div class="e2lab-controls" id="e2Params"></div><button id="e2Run">Recalcular configuración</button><button id="e2Expanded">Ensayar canasta integral ampliada</button><button id="e2Reset">Restaurar valores</button></details>
 <button id="e2Export" style="width:100%">Exportar escenarios filtrados CSV</button><div class="e2lab-note"><b>Lectura del margen</b><p class="e2lab-small">El «margen» es el ahorro monetario neto del usuario de la cadena logística frente a su alternativa: NO es margen de beneficio del transportista ni utilidad del puerto seco. Un valor negativo indica que Juliaca es más caro con estos supuestos. Doce cadenas comparan la misma ruta y tienen ΔCG = 0 (no significa costo logístico cero). El modelo Logit, no calibrado, aún asigna probabilidad a valores negativos: la demanda potencial NO equivale a demanda comercialmente validada.</p></div><div class="e2lab-note"><b>Importante</b><p class="e2lab-small">Los percentiles corresponden a las hipótesis ensayadas y no a frecuencias de contratación observada. Las franjas del E1 representan atractivo logístico, no elegibilidad física. El coeficiente Logit, la segunda manipulación y las frecuencias de servicios siguen sin calibración comercial RP/SP.</p></div></div>`;
}
function stage(){return `<section id="e2labStage" style="display:block"><div class="eyebrow">INFRAPLAN · PUERTO SECO DE SAN ROMÁN</div><div class="lab-title">Laboratorio económico y tarifas por servicio · 2028</div><div class="lab-muted">Base: 14 cadenas E1, 41 perfiles · tarifas publicadas de Cuiabá y costos actuales parametrizados · sensibilidad multivariable de ${D.variables.length-1} parámetros y uso de almacenamiento adicional editable · escenarios Sobol. <b>No se fuerza el ticket</b> y Brasil–Asia se presenta por separado en el módulo condicional de integración: suma capacidad remanente y usa tickets de servicio por régimen como aproximación. No altera el escenario central E1.</div>
<div class="lab-kpis"><div class="lab-kpi"><small>Captación potencial</small><b id="e2Q">—</b><small>t/año · punto seleccionado</small></div><div class="lab-kpi"><small>Ingreso bruto estimado</small><b id="e2R">—</b><small>USD/año</small></div><div class="lab-kpi"><small>Ticket integral</small><b id="e2T">—</b><small>USD/t</small></div><div class="lab-kpi"><small>Escenarios filtrados</small><b id="e2N">—</b><small>16.384 combinaciones</small></div></div>
<div class="lab-grid">
<div class="lab-panel lab-wide"><h3>Diagnóstico económico: lo que explican las distribuciones</h3>
 <p class="lab-caption" id="e2Explain">El modelo debe distinguir ticket, captación y beneficio neto del usuario.</p>
 <div id="e2Conditional" class="lab-plot" style="height:310px"></div><div id="e2ConditionalPerformance" class="lab-plot" style="height:320px"></div>
 <p class="lab-caption">Barras: número de simulaciones por ticket. La captación mediana suele disminuir conforme sube el ticket, aunque las demás variables cambian al mismo tiempo. US$ 5 millones es un umbral descriptivo, no objetivo de calibración.</p></div>
<div class="lab-panel lab-wide"><h3>Valor logístico: situación actual frente al uso del recinto</h3><div id="e2CostBreak" class="lab-plot" style="height:360px"></div><p class="lab-caption">USD/t ponderados por captación. Costo actual de transporte y servicios operativos comparables frente al mismo sistema con Juliaca. La tarifa del recinto se suma una sola vez.</p><div id="e2SavingsTable" class="lab-scroll"></div></div>
<div class="lab-panel lab-wide"><h3>Economía por cadena: ahorro adicional necesario para alcanzar equilibrio</h3><div id="e2Balance" class="lab-plot" style="height:380px"></div>
 <p class="lab-caption">Ahorro adicional requerido = máximo(0, −beneficio neto del usuario). Requiere evidencia de costos sustituibles y beneficios medibles; las fracciones representan hipótesis comerciales.</p></div>
<div class="lab-panel lab-wide"><h3>Tickets por régimen y meta comercial de US$ 18–25/t</h3><div id="e2Bars" class="lab-plot" style="height:315px"></div><p class="lab-caption" id="e2BarNote"></p></div>
<div class="lab-panel lab-wide"><h3>Distribución de los escenarios · barras e intervalos</h3><div id="e2Hist" class="lab-plot" style="height:370px"></div><p class="lab-caption">La franja de 18–25 USD/t es un filtro de exploración, no un mínimo garantizado.</p></div>
<div class="lab-panel lab-wide"><h3>Nube multivariable · captación e ingreso</h3><div class="e2v14-views"><label for="e2ScatterView">Dimensiones</label><select id="e2ScatterView"><option value="2d">2D · captación e ingresos</option><option value="color">2D · color según ticket</option><option value="3d">3D opcional · ticket como tercera dimensión</option></select></div><div id="e2Scatter" class="lab-plot" style="height:390px"></div><p class="lab-caption">Selecciona un punto para cargar sus parámetros muestreados y el uso de almacenamiento editable y recalcular exactamente sus 41 perfiles.</p></div>
<div class="lab-panel"><h3>Composición del ticket de servicios</h3><div id="e2Services" class="lab-plot"></div></div><div class="lab-panel"><h3>Clustering de escenarios (K-means 3 grupos)</h3><div id="e2Clusters" class="lab-plot"></div><p class="lab-caption">Agrupación descriptiva de captación, ingresos y ticket, no segmentación de clientes.</p></div>
<div class="lab-panel lab-wide"><h3>Resultados por cadena · escenario seleccionado</h3><div id="e2Chains" class="lab-scroll"></div></div>
<div class="lab-panel lab-wide"><h3>Detalle de las 41 fichas y economía de usuario</h3><div id="e2Profiles" class="lab-scroll"></div></div>
<div class="lab-panel lab-wide"><h3>Referencias y supuestos de factura</h3><p class="lab-caption">Cuiabá importación (17/06/2025): almacenaje 0,1815 % CIF, primer ciclo 10 días y 0,3630 % por cada ciclo siguiente; exportación (21/10/2025): igual tasa sobre FOB, ciclo 30 días. Movimiento R$ 18,52/t; descarga R$ 1.400/evento; pesaje R$ 120/vehículo; servicios por BL, documento o movimiento. Las frecuencias de utilización de cada servicio son <b>supuestos editables</b>, no datos observados. El precio final de Juliaca no está fijado. <a target="_blank" href="${D.sources[0]}">Tarifario importación</a> · <a target="_blank" href="${D.sources[1]}">Tarifario exportación</a>.</p></div></div></section>`;}
function mkInputs(){
 let root=document.getElementById('e2Params');root.innerHTML=D.variables.map(v=>`<label title="${enc(v.desc)}">${enc(v.key.replace(/_/g,' '))}<span class="e2lab-val">${enc(v.unit)}</span></label><input data-key="${enc(v.key)}" type="number" step="any" min="${v.lo}" max="${v.hi}" value="${v.central}"><small class="e2lab-small">Rango ${fmt(v.lo,2)} – ${fmt(v.hi,2)}</small>`).join('');
}
function readInputs(){const obj={...state.p};document.querySelectorAll('#e2Params input').forEach(el=>{const v=D.variables.find(x=>x.key===el.dataset.key);let n=number(el.value);n=Math.max(v.lo,Math.min(v.hi,n));obj[v.key]=n;});return obj;}
function setInputs(p){state.p={...p};document.querySelectorAll('#e2Params input').forEach(el=>{el.value=p[el.dataset.key]??D.central[el.dataset.key]});}
function actualizarTarifario(){
 const el=document.getElementById('e2TarifarioVivo');if(!el)return;
 const r=D.tarifas,p=state.p;
 const tasa=(d,c)=>r.alm_ciclo1_pct+r.alm_ciclo2_pct*(Math.max(1,Math.ceil(d/c))-1);
 const fila=(nombre,d,c,base)=>`<tr><td>${nombre}</td><td>${fmt(d,0)}</td><td>${Math.max(1,Math.ceil(d/c))}</td><td>${fmt(tasa(d,c)*100,4)} % de ${base}</td></tr>`;
 el.innerHTML=`<table class="e2-tarifa-tabla"><thead><tr><th>Régimen</th><th>Días</th><th>Ciclos</th><th>Tasa acumulada</th></tr></thead><tbody>${fila('Importación',p.dias_importacion,10,'CIF')}${fila('Tránsito',p.dias_transito,10,'CIF')}${fila('Exportación',p.dias_exportacion,30,'FOB')}</tbody></table><small>Primer ciclo: ${fmt(r.alm_ciclo1_pct*100,4)} %. Cada ciclo posterior: ${fmt(r.alm_ciclo2_pct*100,4)} %. Factor tarifario aplicado al ticket: ${fmt(p.factor_tarifas_referencia,2)}. La facturación por tonelada también depende del valor comercial proxy y de la frecuencia de depósito por familia.</small>`;
}
function dashboardSelected(){
 actualizarTarifario();
 const q=calc(state.p);state.selection=q;
 const a=q.out;
 for(const [id,val,dp] of [['e2Q',a.toneladas,0],['e2R',a.ingresos_usd/1e6,2],['e2T',a.ticket_usd_t,2]])document.getElementById(id).innerText=(id==='e2R'?'US$ ':'')+fmt(val,dp)+(id==='e2R'?' M':id==='e2T'?' USD/t':'');
 const bars=['IMPORTACION','EXPORTACION','TRANSITO','BRASIL_PERU'];const names=['Importación','Exportación','Tránsito','Brasil–Perú mixto'];
 const data=bars.map(reg=>{let rs=q.records.filter(r=>r.regimen===reg),tons=rs.reduce((a,b)=>a+b.captacion_t,0),rev=rs.reduce((a,b)=>a+b.ingresos_usd,0);return {tons,ticket:tons?rev/tons:0};});
 const mean=k=>q.records.reduce((a,r)=>a+r.captacion_t*(r[k]||0),0)/Math.max(1,a.toneladas);
 const act=mean('costo_actual_proxy_usd_t'),con=mean('costo_con_juliaca_proxy_usd_t');
 Plotly.react('e2CostBreak',[{type:'bar',x:['Situación actual','Con Juliaca'],y:[act,con],marker:{color:['#547c99','#d6ac28']},text:[fmt(act,2),fmt(con,2)],textposition:'outside'}],{...layout('Costo generalizado USD/t'),yaxis:{title:'USD/t · conceptos comparables',range:[0,Math.max(act,con)*1.18]}},options);
 const parts=['almacenaje','documentacion','tiempo_camion','inventario','riesgo','distribucion'];
 const namesParts=['Almacenamiento','Documentación','Tiempo del camión','Capital de inventario','Seguridad de carga','Distribución'];
 const va=parts.map(k=>q.records.reduce((a,r)=>a+(r.benefitParts[k]||0)*r.captacion_t,0)/Math.max(1,a.toneladas));
 document.getElementById('e2SavingsTable').innerHTML='<table class="lab-table"><thead><tr><th>Beneficio sustituible</th><th>USD/t ponderado</th><th>Interpretación</th></tr></thead><tbody>'+parts.map((k,i)=>'<tr><td>'+namesParts[i]+'</td><td>'+fmt(va[i],2)+'</td><td>'+(i===3?'Costo financiero de inventario; no se confunde con espera del camión':i===4?'Costo esperado de daño o pérdida evitado':'Diferencia entre gasto actual y costo remanente')+'</td></tr>').join('')+'</tbody></table>';
 Plotly.react('e2Bars',[{type:'bar',x:names,y:data.map(z=>z.ticket),marker:{color:['#d5a120','#4c8fae','#5eac8b','#7d8ba6']},text:data.map(z=>fmt(z.ticket,2)),textposition:'outside'}],{...layout('Ticket USD/t'),shapes:[{type:'rect',xref:'paper',yref:'y',x0:0,x1:1,y0:18,y1:25,fillcolor:'rgba(48,153,117,.11)',line:{width:0}}],yaxis:{range:[0,Math.max(30,...data.map(z=>z.ticket*1.18))]}} ,options);
 document.getElementById('e2BarNote').innerHTML=`Prima monetaria adicional a justificar: US$ ${fmt(a.brecha_economica_media_usd_t,2)}/t (promedio ponderado). La captación Logit no exige un ahorro monetario positivo, pero la preferencia basal es una hipótesis sin calibración observada.`;
 let services=Object.keys(q.records[0].operaciones),vals=services.map(s=>q.records.reduce((sum,r)=>sum+r.operaciones[s]*r.captacion_t,0)/Math.max(1,a.toneladas));
 Plotly.react('e2Services',[{type:'bar',orientation:'h',y:services,x:vals,marker:{color:'#d3a425'}}],{...layout('USD/t ponderado'),margin:{l:116,r:14,t:26,b:40}},options);
 document.getElementById('e2Explain').innerHTML=`<b>Lectura del escenario:</b> ${fmt(a.toneladas)} t de captación condicional, US$ ${fmt(a.ingresos_usd/1e6,2)} M de ingresos brutos y ticket US$ ${fmt(a.ticket_usd_t,2)}/t. Prima adicional media a justificar: US$ ${fmt(a.brecha_economica_media_usd_t,2)}/t. El Logit conserva probabilidades positivas aun con costo superior; ello depende de una propensión de elección hipotética, no de entrevistas ni contratos. La prima no es un ingreso adicional ni un ahorro asegurado.`;
 const bal={}; for(const r of q.records){let x=bal[r.id]||(bal[r.id]={q:0,need:0,sav:0,ticket:0});x.q+=r.captacion_t;x.need+=r.captacion_t*Math.max(0,-r.margin);x.sav+=r.captacion_t*r.save;x.ticket+=r.captacion_t*r.ticket;}
 const bard=Object.entries(bal).map(([k,v])=>({key:k,q:v.q,need:v.q?v.need/v.q:0})).sort((a,b)=>b.q-a.q);
 Plotly.react('e2Balance',[{type:'bar',x:bard.map(x=>x.key),y:bard.map(x=>x.need),marker:{color:bard.map(x=>x.need>0?'#c26748':'#4b9b81')}}],{...layout('Brecha económica por cadena'),xaxis:{title:'Cadena E1'},yaxis:{title:'USD/t adicional para equilibrio'}},options);
 const cg={};for(const r of q.records){let z=cg[r.id]||(cg[r.id]={id:r.id,reg:r.regimen,mercado:r.mercado,Q:0,ton:0,rev:0,margin:0,sav:0,extra:0,delta:0});z.Q+=r.Q2028_t;z.ton+=r.captacion_t;z.rev+=r.ingresos_usd;z.margin+=r.margin*r.captacion_t;z.sav+=r.save*r.captacion_t;z.extra+=r.extra*r.captacion_t;z.delta+=r.delta*r.captacion_t;}
 const rows=Object.values(cg).sort((a,b)=>b.ton-a.ton);
 document.getElementById('e2Chains').innerHTML=`<table class="lab-table"><thead><tr><th>Cadena</th><th>Mercado</th><th>Régimen</th><th>Q2028 t</th><th>Captación t</th><th>Ingresos USD</th><th>Ticket USD/t</th><th>Ahorros USD/t</th><th>Adicionales y desvío USD/t</th><th>Prima adicional USD/t</th><th>Prima / valor proxy</th></tr></thead><tbody>${rows.map(z=>`<tr><td>${z.id}</td><td>${enc(z.mercado)}</td><td>${z.reg}</td><td>${fmt(z.Q)}</td><td>${fmt(z.ton)}</td><td>${fmt(z.rev)}</td><td>${fmt(z.ton?z.rev/z.ton:0,2)}</td><td>${fmt(z.ton?z.sav/z.ton:0,2)}</td><td>${fmt(z.ton?(z.extra+z.delta)/z.ton:0,2)}</td><td>${fmt(z.ton?Math.max(0,-z.margin/z.ton):0,2)}</td><td>Ver fichas por producto</td></tr>`).join('')}</tbody></table>`;
 document.getElementById('e2Profiles').innerHTML=`<table class="lab-table"><thead><tr><th>Cadena</th><th>Producto</th><th>Régimen</th><th>Días</th><th>Ticket USD/t</th><th>Costo actual USD/t</th><th>Costo con Juliaca USD/t</th><th>Prima adicional USD/t</th><th>% valor comercial proxy</th><th>Captación t</th><th>Ingresos USD</th></tr></thead><tbody>${q.records.map(r=>`<tr><td>${r.id}</td><td>${enc(r.producto)}</td><td>${r.regimen}</td><td>${fmt(r.days,1)}</td><td>${fmt(r.ticket,2)}</td><td>${fmt(r.costo_actual_proxy_usd_t,2)}</td><td>${fmt(r.costo_con_juliaca_proxy_usd_t,2)}</td><td>${fmt(Math.max(0,-r.margin),2)}</td><td>${r.valor_proxy_usd_t>0?fmt(100*Math.max(0,-r.margin)/(r.valor_proxy_usd_t*(state.p.factor_valor_aduanero_proxy||1)),2)+'%':'N/D'}</td><td>${fmt(r.captacion_t)}</td><td>${fmt(r.ingresos_usd)}</td></tr>`).join('')}</tbody></table>`;
}
const options={responsive:true,displaylogo:false};
function layout(title){return {paper_bgcolor:'white',plot_bgcolor:'#fff',font:{color:'#304054',size:11},margin:{l:66,r:18,t:25,b:55},xaxis:{gridcolor:'#e2e8ef'},yaxis:{gridcolor:'#e2e8ef'},showlegend:false,title:{text:''}};}
function filtered(){const kind=document.getElementById('e2Filter').value,g=document.getElementById('e2Group').value;return D.sim.filter(r=>{
 if(g!=='all'&&String(r.grupo)!==g)return false;
 if(kind==='range')return r.ticket_usd_t>=18&&r.ticket_usd_t<=25;
 if(kind==='imp')return r.ticket_importacion_usd_t>=18&&r.ticket_importacion_usd_t<=25;
 if(kind==='exp')return r.ticket_exportacion_usd_t>=18&&r.ticket_exportacion_usd_t<=25;
 if(kind==='pos')return r.fraccion_margen_positivo>=.5;
 if(kind==='econ')return r.toneladas_margen_positivo>=1;
 if(kind==='revenues')return r.ingresos_usd>=5e6;
 return true;});}
function charts(){const v=document.getElementById('e2Metric').value,rs=filtered();document.getElementById('e2N').innerText=fmt(rs.length);
 const vv=rs.map(r=>r[v]||0);
 const group=D.diagnostico_bins||[];
 Plotly.react('e2Conditional',[{type:'bar',x:group.map(b=>b.ticket_desde_usd_t+'–'+b.ticket_hasta_usd_t),y:group.map(b=>b.casos),name:'Nº escenarios',marker:{color:'#c6a540'},text:group.map(b=>fmt(b.casos)),textposition:'auto'}],{...layout('Distribución por ticket'),xaxis:{title:'Ticket efectivo (USD/t)'},yaxis:{title:'Nº de escenarios'}},options);
 Plotly.react('e2ConditionalPerformance',[
  {type:'scatter',mode:'lines+markers',name:'Captación mediana (mil t)',x:group.map(b=>b.ticket_desde_usd_t+'–'+b.ticket_hasta_usd_t),y:group.map(b=>b.captacion_mediana_t/1000),line:{color:'#377fa4',width:3}},
  {type:'scatter',mode:'lines+markers',name:'Ingreso mediano (US$ M)',x:group.map(b=>b.ticket_desde_usd_t+'–'+b.ticket_hasta_usd_t),y:group.map(b=>b.ingreso_mediano_usd/1e6),yaxis:'y2',line:{color:'#59ad8b',width:3}}
 ],{...layout('Medianas condicionadas por banda de ticket'),showlegend:true,legend:{orientation:'h',y:1.14},xaxis:{title:'Ticket USD/t'},yaxis:{title:'Captación mediana (mil t)'},yaxis2:{title:'Ingreso mediano (US$ M)',overlaying:'y',side:'right',showgrid:false}},options);
 Plotly.react('e2Hist',[{type:'histogram',x:vv,nbinsx:38,marker:{color:'#b6922c',line:{width:.25,color:'#fff'}},hovertemplate:'Intervalo %{x}<br>Escenarios %{y}<extra></extra>'}],{...layout('Distribución'),shapes:v.startsWith('ticket_')?[{type:'rect',xref:'x',yref:'paper',x0:18,x1:25,y0:0,y1:1,fillcolor:'rgba(67,177,124,.12)',line:{width:0}}]:[]},options);
 const sample=rs.length>3000?rs.filter((_,i)=>i%Math.ceil(rs.length/3000)===0):rs;
 const grouped=[0,1,2].map(i=>({type:'scattergl',mode:'markers',name:`Grupo ${i+1}`,x:sample.filter(p=>p.grupo===i).map(p=>p.toneladas),y:sample.filter(p=>p.grupo===i).map(p=>p.ingresos_usd/1e6),customdata:sample.filter(p=>p.grupo===i).map(p=>p.scenario),marker:{size:5,color:palette[i],opacity:.58},hovertemplate:'Captación %{x:,.0f} t<br>Ingreso US$ %{y:.2f} M<extra></extra>'}));
 const scatterMode=document.getElementById('e2ScatterView')?.value||'2d';
 const viewTraces=scatterMode==='3d'?grouped.map(tr=>({...tr,type:'scatter3d',z:sample.filter(r=>r.grupo===Number(tr.name.slice(-1))-1).map(r=>r.ticket_usd_t),marker:{...tr.marker,size:3}})):scatterMode==='color'? [{type:'scattergl',mode:'markers',name:'Ticket',x:sample.map(r=>r.toneladas),y:sample.map(r=>r.ingresos_usd/1e6),customdata:sample.map(r=>r.scenario),marker:{size:6,color:sample.map(r=>r.ticket_usd_t),colorscale:'Viridis',showscale:true,colorbar:{title:'USD/t'},opacity:.68},hovertemplate:'Captación %{x:,.0f} t<br>Ingreso US$ %{y:.2f} M<extra></extra>'}]:grouped;
 const viewLayout=scatterMode==='3d'?{paper_bgcolor:'white',font:{color:'#263348'},margin:{l:0,r:0,t:5,b:0},scene:{xaxis:{title:'Captación (t)'},yaxis:{title:'Ingresos US$ M'},zaxis:{title:'Ticket USD/t'}},showlegend:true}: {...layout('Toneladas vs ingreso'),showlegend:scatterMode!=='color',xaxis:{title:'Captación t/año'},yaxis:{title:'Ingresos US$ M'},legend:{orientation:'h',y:1.13}};
 Plotly.react('e2Scatter',viewTraces,viewLayout,options).then(()=>{const gd=document.getElementById('e2Scatter');gd.removeAllListeners?.('plotly_click');gd.on('plotly_click',e=>{const id=e.points?.[0]?.customdata;let match=D.sim.find(r=>r.scenario===id);if(match){let p={};for(const v of D.variables)p[v.key]=(match[v.key]??D.central[v.key]);setInputs(p);dashboardSelected();document.getElementById('e2labStage').scrollTo({top:0,behavior:'smooth'});}})});
 Plotly.react('e2Clusters',[{type:'bar',x:['Grupo 1','Grupo 2','Grupo 3'],y:[0,1,2].map(g=>rs.filter(r=>r.grupo===g).length),marker:{color:palette}}],{...layout('Escenarios por grupo')},options);
}
function csvDownload(){const rs=filtered(),ks=['scenario',...D.variables.map(x=>x.key),'toneladas','ingresos_usd','ticket_usd_t','ticket_importacion_usd_t','ticket_exportacion_usd_t'];
 const csv=[ks.join(','),...rs.map(r=>ks.map(k=>r[k]).join(','))].join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='ESCENARIOS_E2_MOTOR_BRASIL.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function mount(standalone){let main=document.querySelector('main');if(!main)return;if(!document.getElementById('e2labStage'))main.insertAdjacentHTML('beforeend',stage());else document.getElementById('e2labStage').style.display='block';const container=standalone?document.getElementById('labSide'):document.getElementById('content');container.innerHTML=side();mkInputs();

 const presets={
  down:{fraccion_almacenaje_sustituible:.45,fraccion_espera_operativa_evitada:.25,fraccion_documentacion_sustituible:.30,fraccion_distribucion_sustituible:.40,prob_base_alta:.31,prob_base_media:.21,prob_base_condicional:.09,disponibilidad_recinto:.82},
  up:{fraccion_almacenaje_sustituible:.82,fraccion_espera_operativa_evitada:.62,fraccion_documentacion_sustituible:.62,fraccion_distribucion_sustituible:.72,prob_base_alta:.48,prob_base_media:.35,prob_base_condicional:.19,disponibilidad_recinto:.97}
 };
 const switchPreset=changes=>{setInputs({...D.central,...changes});dashboardSelected();document.dispatchEvent(new CustomEvent('e2:params'));};
 document.getElementById('e2PresetDown').onclick=()=>switchPreset(presets.down);
 document.getElementById('e2PresetBase').onclick=()=>switchPreset({});
 document.getElementById('e2PresetUp').onclick=()=>switchPreset(presets.up);
 document.getElementById('e2Run').onclick=()=>{state.p=readInputs();dashboardSelected();document.dispatchEvent(new CustomEvent('e2:params'));};document.getElementById('e2Expanded').onclick=()=>{setInputs({...state.p,factor_servicios_opcionales:1.25});dashboardSelected();document.dispatchEvent(new CustomEvent('e2:params'));};document.getElementById('e2Reset').onclick=()=>{setInputs(D.central);dashboardSelected();document.dispatchEvent(new CustomEvent('e2:params'));};document.getElementById('e2Export').onclick=csvDownload;
 ['e2Metric','e2Filter','e2Group','e2ScatterView'].forEach(id=>document.getElementById(id).onchange=charts);
 setInputs(D.central);dashboardSelected();charts();state.ready=true;document.dispatchEvent(new CustomEvent('e2:mounted'));
}
function boot(){if(document.body.dataset.e2standalone==='1'){mount(true);return;}
const nav=document.querySelector('nav');if(!nav)return;
let b=document.createElement('button');b.dataset.tab='e2_laboratorio';b.textContent='12 Laboratorio estadístico';nav.appendChild(b);
b.addEventListener('click',()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');mount(false)});
 nav.querySelectorAll('button:not([data-tab="e2_laboratorio"])').forEach(el=>el.addEventListener('click',()=>{let n=document.getElementById('e2labStage');if(n)n.style.display='none';}));
}
function radarPreview(p){state.p={...state.p,...p};setInputs(state.p);actualizarTarifario();const a=calc(state.p).out;
 for(const [id,v,dp] of [['e2Q',a.toneladas,0],['e2R',a.ingresos_usd/1e6,2],['e2T',a.ticket_usd_t,2]]){const el=document.getElementById(id);if(el)el.innerText=(id==='e2R'?'US$ ':'')+fmt(v,dp)+(id==='e2R'?' M':id==='e2T'?' USD/t':'');}
 return a;}
window.E2_ECONOMIC_UI={start:boot,getParams:()=>({...state.p}),getVariables:()=>D.variables,
 previewParams:radarPreview,setParams:(p)=>{setInputs({...state.p,...p});dashboardSelected();document.dispatchEvent(new CustomEvent('e2:params'));},
 evaluate:(p)=>calc(p)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
