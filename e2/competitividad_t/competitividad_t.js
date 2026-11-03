'use strict';
(function(){
const D=window.E2_MOTOR_DATA, E=window.E2_ENGINE_CALC?.evaluate;
if(!D || !E){console.warn('E2 T*: motor no disponible');return;}
const F=(x,k=1)=>Number(x||0).toLocaleString('es-PE',{minimumFractionDigits:k,maximumFractionDigits:k});
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const pp={...D.central,capacidad_t_anio:1e15};
let mounted=false;
const percents=Array.from({length:21},(_,i)=>0.20+i*0.05);
function get(factor=1){return E({...pp,factor_tarifas_referencia:factor});}
function calc(z){
 let avail=0, strict=0, strictChoice=0, conditional=0, revenue=0;
 for(const r of z.records){
  const physical=r.Q2028_t*r.eligibilidad*pp.disponibilidad_recinto;
  if(r.eligibilidad<=0)continue;
  avail+=physical;
  if(r.margin>=-1e-7){strict+=physical; strictChoice+=r.captacion_t;}else conditional+=r.captacion_t;
  revenue+=r.ingresos_usd;
 }
 return {avail,strict,strictChoice,conditional,total:strictChoice+conditional,revenue};
}
const aggregate=(rows)=>{
 const m=new Map();
 for(const r of rows){let z=m.get(r.id);
  if(!z){z={id:r.id,market:r.mercado,reg:r.regimen,n:0,wt:0,ticket:0,star:0,prem:0,chosen:0,market_t:0,source:r.familia};m.set(r.id,z)}
  const w=r.Q2028_t*r.eligibilidad;z.market_t+=r.Q2028_t;z.n+=1;z.wt+=w;z.ticket+=w*r.ticket;z.star+=w*(r.save-r.extra-r.delta);z.prem+=w*Math.max(0,-r.margin);z.chosen+=r.captacion_t;
 }
 return [...m.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(z=>({...z,ticket:z.wt?z.ticket/z.wt:null,star:z.wt?z.star/z.wt:null,prem:z.wt?z.prem/z.wt:null}));
};
const yearSeries=(q,rate)=>Array.from({length:28},(_,j)=>{const y=2028+j,ramp=[.5,.65,.8,.9,1][Math.min(j,4)];return {year:y,ramp,ton:q*ramp*Math.pow(1+rate,j)}});
function csv(rows){if(!rows.length)return;let keys=Object.keys(rows[0]);let content=[keys.join(';'),...rows.map(r=>keys.map(k=>String(r[k]??'').replaceAll(';',',')).join(';'))].join('\r\n');let u=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8'}));let a=document.createElement('a');a.href=u;a.download='TARIFA_MAXIMA_COMPETITIVIDAD_E2.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),500);}
function content(){return `<h2>Competitividad económica · tarifa máxima T*</h2><p>La tarifa máxima T* se obtiene de los ahorros sustituibles menos costos adicionales y diferencial vial. No es una tarifa aprobada ni demuestra viabilidad financiera del operador.</p><div class="tWarn">A la canasta de referencia, el volumen monetariamente competitivo del escenario central es nulo. El Logit permite captación condicionada cuando el usuario enfrenta un sobrecosto; p0 y λ siguen siendo hipótesis no calibradas con elección observada. Entrevistas E-01 a E-03 y reunión SUNAT (13/10/2026) constituyen evidencia cualitativa, no calibración.</div><div class="tKpis" id="tKpis"></div><div class="tcard"><div class="tbar"><label>Tarifa de canasta <input id="tFactor" type="number" value="100" min="20" max="120" step="5"/> %</label><button id="tGo">Recalcular</button><button id="tCsv">Exportar T* por cadena</button></div><p class="tFine">Curva 20–120%: el volumen competitivo es elegible/disponible, no contratado. La captación estricta aplica además el Logit, siempre sin restringir por capacidad.</p><div class="tPlot" id="tCurve"></div><div class="tOverflow" id="tCurvesTable"></div></div><div class="tcard"><h3>Rangos P10/P50/P90 de captación</h3><p class="tFine">Corresponden a las 16.384 combinaciones exploratorias de parámetros, incluidas capacidades variables; no son intervalos de confianza ni se deben sumar al volumen competitivo de la curva sin capacidad.</p><div id="tLayers"></div></div><div class="tcard"><h3>T* y brecha por cadena</h3><div class="tOverflow" id="tChain"></div></div><div class="tcard"><h3>Canasta de servicios y desglose de factura</h3><div class="tOverflow" id="tBreakdown"></div></div><div class="tcard"><h3>Proyección anual 2028–2055 · hipótesis ilustrativa</h3><p class="tFine">Tasas de toneladas 2%, 3% y 4% anuales como ensayos, NO pronósticos BCRP/MEF. En 2028 se aplica ramp-up 50%; año 5 = 2032 (100%). No se atribuye demanda incremental Brasil–Asia sin filtros y habilitación verificados.</p><div class="tPlot" id="tAnnual"></div></div><div class="tcard"><h3>Tratamiento de escenarios y evidencia</h3><p><b>Estricta:</b> usuarios con T* ≥ tarifa evaluada. <b>Condicionada:</b> elección Logit cuando la tarifa supera T*. Son grupos excluyentes por perfil. <b>Habilitación:</b> condición legal transversal, no un volumen adicional para sumar.</p><p><b>Incremental Brasil–Asia:</b> fuera del escenario central; sus factores de conciliación no verificados no generan volumen añadido en esta pantalla. Requiere clasificación contenedor/general/líquidos/granel y competitividad de corredor completo.</p><p class="tFine">Cuiabá 21/10/2025: 0,1815% primer ciclo; 0,3630% ciclos posteriores. Regla «mayor valor entre peso y volumen» y tarifa de granel de Anápolis son alternativas pendientes de datos de volumen/densidad y validación de aplicabilidad; no se mezclan arbitrariamente con la canasta central.</p></div>`;}
function update(){let percent=Number(document.getElementById('tFactor')?.value||100);if(!Number.isFinite(percent))percent=100;percent=Math.max(20,Math.min(120,percent));const f=percent/100,z=get(f),s=calc(z),kpis=document.getElementById('tKpis');
 kpis.innerHTML=[['Mercado disponible',F(s.avail/1000,0)+' kt'],['Volumen competitivo',F(s.strict/1000,0)+' kt'],['Captación estricta',F(s.strictChoice/1000,0)+' kt'],['Captación condicionada',F(s.conditional/1000,0)+' kt'],['Captación total sin capacidad',F(s.total/1000,0)+' kt'],['Ingresos brutos del escenario', 'US$ '+F(s.revenue/1e6,2)+' M']].map(([lab,val])=>`<article><small>${lab}</small><b>${val}</b></article>`).join('');
 const distribution=(key)=>D.sim.map(r=>key==='strict'?r.toneladas_margen_positivo:Math.max(0,r.toneladas-r.toneladas_margen_positivo)).sort((a,b)=>a-b);const quant=(v,q)=>{let x=(v.length-1)*q,i=Math.floor(x),j=Math.ceil(x);return v[i]+(v[j]-v[i])*(x-i)};const a=distribution('strict'),b=distribution('conditional');document.getElementById('tLayers').innerHTML=`<table><thead><tr><th>Capa</th><th>P10 (kt)</th><th>P50 (kt)</th><th>P90 (kt)</th></tr></thead><tbody><tr><td>Estricta</td>${[.1,.5,.9].map(v=>`<td>${F(quant(a,v)/1000,0)}</td>`).join('')}</tr><tr><td>Condicionada</td>${[.1,.5,.9].map(v=>`<td>${F(quant(b,v)/1000,0)}</td>`).join('')}</tr><tr><td>Habilitada / incremental</td><td colspan="3">No estimable sin habilitación y rutas verificadas; no se suma como tercer volumen.</td></tr></tbody></table>`;
 const chain=aggregate(z.records),th=['Cadena','Mercado E1','Régimen','Disponible (t)','Ticket (USD/t)','T* (USD/t)','Brecha (USD/t)','Captación condicionada (t)'];
 document.getElementById('tChain').innerHTML=`<table><thead><tr>${th.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${chain.map(r=>`<tr><td>${r.id}</td><td>${esc(r.market)}</td><td>${esc(r.reg)}</td><td>${F(r.wt,0)}</td><td>${r.ticket===null?'N/A':F(r.ticket,2)}</td><td>${r.star===null?'N/A':F(r.star,2)}</td><td>${r.prem===null?'N/A':F(r.prem,2)}</td><td>${F(r.chosen,0)}</td></tr>`).join('')}</tbody></table>`;
 document.getElementById('tCsv').onclick=()=>csv(chain);
 const comps=['almacenamiento','movimiento','pesaje','descarga','carga_salida','documentos','inspeccion','desconsolidacion','handling'];
 let sums={};for(const x of comps)sums[x]=z.records.reduce((acc,r)=>acc+r.captacion_t*r.operaciones[x]*f,0)/Math.max(1,s.total);
 document.getElementById('tBreakdown').innerHTML=`<table><thead><tr><th>Componente tarifario</th><th>USD/t ponderado por captación</th></tr></thead><tbody>${comps.map(k=>`<tr><td>${k.replaceAll('_',' ')}</td><td>${F(sums[k],2)}</td></tr>`).join('')}<tr><th>Total factura</th><th>${F(z.out.ticket_usd_t,2)}</th></tr></tbody></table>`;
 const curves=percents.map(factor=>{let a=calc(get(factor));return {factor:Math.round(factor*100),...a};});
 document.getElementById('tCurvesTable').innerHTML=`<table><thead><tr><th>Tarifa (% canasta)</th><th>Volumen competitivo (t)</th><th>Captación estricta (t)</th><th>Condicionada (t)</th><th>Total Logit (t)</th></tr></thead><tbody>${curves.map(r=>`<tr><td>${r.factor}%</td><td>${F(r.strict,0)}</td><td>${F(r.strictChoice,0)}</td><td>${F(r.conditional,0)}</td><td>${F(r.total,0)}</td></tr>`).join('')}</tbody></table>`;
 if(window.Plotly){let common={paper_bgcolor:'white',plot_bgcolor:'#fff',margin:{l:65,r:15,t:20,b:55},font:{color:'#34465b',size:11},legend:{orientation:'h',y:1.22},xaxis:{title:'% de la canasta de referencia'},yaxis:{title:'Toneladas/año'}};
  Plotly.react('tCurve',[{x:curves.map(r=>r.factor),y:curves.map(r=>r.strict),name:'Volumen monetariamente competitivo',type:'scatter',mode:'lines+markers',line:{color:'#35b6a4'}},{x:curves.map(r=>r.factor),y:curves.map(r=>r.strictChoice),name:'Captación estricta Logit',type:'scatter',mode:'lines',line:{color:'#3563e9'}},{x:curves.map(r=>r.factor),y:curves.map(r=>r.conditional),name:'Captación condicionada',type:'scatter',mode:'lines',line:{color:'#a77e3a'}}],common,{responsive:true,displaylogo:false});
  Plotly.react('tAnnual',[{x:yearSeries(s.total,0.02).map(r=>r.year),y:yearSeries(s.total,0.02).map(r=>r.ton),type:'scatter',mode:'lines',name:'2% anual'},{x:yearSeries(s.total,0.03).map(r=>r.year),y:yearSeries(s.total,0.03).map(r=>r.ton),type:'scatter',mode:'lines',name:'3% anual'},{x:yearSeries(s.total,0.04).map(r=>r.year),y:yearSeries(s.total,0.04).map(r=>r.ton),type:'scatter',mode:'lines',name:'4% anual'}],{...common,xaxis:{title:'Año'},yaxis:{title:'Captación potencial ilustrativa (t/año)'}},{responsive:true,displaylogo:false});
 }
}
function boot(){let nav=document.querySelector('nav');if(!nav||!D)return;let button=document.createElement('button');button.dataset.tab='e2_tarifa_maxima';button.textContent='11 Tarifa máxima T*';nav.insertBefore(button,nav.querySelector('button[data-tab="e2_laboratorio"]') || null);
 const stage=document.createElement('section');stage.id='e2TStage';stage.hidden=true;stage.innerHTML=content();document.querySelector('main').appendChild(stage);
 button.addEventListener('click',()=>{document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));button.classList.add('active');stage.hidden=false; const prev=document.getElementById('e2labStage');if(prev)prev.style.display='none'; if(!mounted){mounted=true;document.getElementById('tGo').addEventListener('click',update);update();}});
 nav.querySelectorAll('button:not([data-tab="e2_tarifa_maxima"])').forEach(b=>b.addEventListener('click',()=>{stage.hidden=true;}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
