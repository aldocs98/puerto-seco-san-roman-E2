"use strict";
(function(){
 const fmt=(v,d=0)=>Number(v||0).toLocaleString('es-PE',{minimumFractionDigits:d,maximumFractionDigits:d});
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data=null,params={factor_mercado_accesible:1,factor_preferencia_pacifico:1,factor_habilitacion:1,tarifa_factor:1},last=null;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const logit=p=>Math.log(clamp(p,0.00001,0.99999)/(1-clamp(p,0.00001,0.99999)));
 const logistic=u=>1/(1+Math.exp(-clamp(u,-50,50)));
 const num=(r,k)=>Number(r[k]||0);
 async function load(){if(!data){const rsp=await fetch('e2/asia/brasil_asia_v2_referencia.json');if(!rsp.ok)throw Error('No se carga fuente Brasil–Asia '+rsp.status);data=(await rsp.json()).filas; }return data;}
 function econParams(){return {...window.E2_MOTOR_DATA.central,...(window.E2_ECONOMIC_UI?.getParams?.()||{})};}
 function compute(p=econParams(),a=params){const source=window.E2_MOTOR_DATA;const ev=window.E2_ENGINE_CALC.evaluate(p).out;const capacity=p.capacidad_t_anio;
 const R=data||[], rows=[],seen=new Set();let trade2025=0,trade2028=0,eligible2028=0,rawQ=0,rawRev=0;
 for(const r of R){const key=r.estado+'|'+r.sentido;
  if(!seen.has(key)){seen.add(key);trade2025+=num(r,'referencia_e1_2025_t');trade2028+=num(r,'referencia_proyectada_t');eligible2028+=num(r,'mercado_filtrado_t')*a.factor_mercado_accesible;}
  const ex=r.sentido.startsWith('Exportacion');const ticket=(ex?ev.ticket_exportacion_usd_t:ev.ticket_importacion_usd_t)*a.tarifa_factor;
  const pPac=logistic(logit(num(r,'prob_pacifico'))+Math.log(Math.max(.001,a.factor_preferencia_pacifico)));
  const originalTicket=num(r,'ticket_usd_t');
  const pJul=logistic(logit(num(r,'prob_usar_juliaca_condicional'))-(ticket-originalTicket)/Math.max(0.1,p.escala_logit_usd_t));
  const accessible=clamp(num(r,'participacion_accesible_hipotetica')*a.factor_mercado_accesible,0,1);
  const hab=clamp(num(r,'habilitacion_legal_operacional')*a.factor_habilitacion,0,1);
  // No se calcula captación incremental sin evidencia de rutas, servicios y permisos.
  const q=0; // No utilizar coeficientes de conciliación retrospectivos.
  rows.push({estado:r.estado,sentido:r.sentido,puerto:r.puerto,q_raw:q,pacifico:pPac,juliaca:pJul,ticket,ingreso_raw:q*ticket});rawQ+=q;rawRev+=q*ticket;
 }
 const available=Math.max(0,capacity-ev.toneladas),k=rawQ>0?Math.min(1,available/rawQ):1;
 const output=rows.map(r=>({...r,toneladas:r.q_raw*k,ingresos_usd:r.ingreso_raw*k}));
 const Q=rawQ*k;const Rv=rawRev*k;
 return {trade2025,trade2028,eligible2028,asia_t:Q,asia_revenue:Rv,asia_ticket:Q?Rv/Q:0,e1:ev,total_t:ev.toneladas+Q,total_revenue:ev.ingresos_usd+Rv,capacity,capacity_used:(ev.toneladas+Q)/capacity,unserved:rawQ-Q,rows:output,raw_t:rawQ,source_t:null};
 }
 function panel(prefix,lab){const style=lab?'e2asia-panel e2asia-lab':'e2asia-panel';return `<div class="${style}" id="${prefix}Root">
 <h3>Brasil ↔ Asia vía Perú · mercado referencial</h3><p>Comercio de Mato Grosso, Rondônia, Amazonas y Acre con China/Japón (2025); participación territorial y de corredor calculada para 2028. No se contabiliza como exportación/importación propia de Perú ni forma parte del central E1.</p>
 <div class="e2asia-controls"><div><label>Mercado accesible · <span id="${prefix}vAcc">1,00×</span></label><input id="${prefix}Acc" type="range" min="0" max="1.5" step="0.05" value="${params.factor_mercado_accesible}"></div>
 <div><label>Preferencia por corredor Pacífico · <span id="${prefix}vPac">1,00×</span></label><input id="${prefix}Pac" type="range" min="0.25" max="2" step="0.05" value="${params.factor_preferencia_pacifico}"></div>
 <div><label>Habilitación operativa relativa · <span id="${prefix}vHab">1,00×</span></label><input id="${prefix}Hab" type="range" min="0" max="1" step="0.05" value="${params.factor_habilitacion}"></div>
 <div><label>Tarifa de servicios relativa · <span id="${prefix}vTar">1,00×</span></label><input id="${prefix}Tar" type="range" min="0.75" max="1.5" step="0.05" value="${params.tarifa_factor}"></div></div>
 <div class="e2asia-metrics"><div class="e2asia-metric"><small>Mercado Brasil–Asia 2025*</small><strong id="${prefix}Market">—</strong></div><div class="e2asia-metric"><small>Captación adicional validada</small><strong id="${prefix}Q">—</strong></div><div class="e2asia-metric"><small>Ingreso adicional por servicios</small><strong id="${prefix}Rev">—</strong></div><div class="e2asia-metric"><small>Captación total E1 + Asia</small><strong id="${prefix}Total">—</strong></div></div>
 <div id="${prefix}Graph" style="height:245px"></div><label>Mercado por estado</label><select id="${prefix}State"><option value="">Todos los estados</option><option>Mato Grosso</option><option>Rondônia</option><option>Amazonas</option><option>Acre</option></select>
 <div id="${prefix}Rows"></div><button id="${prefix}Export">Descargar desglose CSV</button>
 <p class="e2asia-note">*El comercio Brasil–Asia es un mercado comercial de referencia, no un flujo verificado por Perú. Se retiró del cálculo el factor de conciliación sin derivación reproducible. Por tanto, la captación adicional y su ingreso permanecen en cero mientras se validan grupos de mercancía, costos puerta a puerta, desvío al Pacífico, competencia portuaria y habilitación legal. Las probabilidades y controles indicativos no equivalen a una demanda aprobada.</p></div>`;}
 function render(prefix){const root=document.getElementById(prefix+'Root');if(!root||!data)return;const calc=compute();last=calc;
 [['Market',fmt(calc.trade2025)+' t'],['Q',fmt(calc.asia_t)+' t'],['Rev','US$ '+fmt(calc.asia_revenue/1e6,2)+' M'],['Total',fmt(calc.total_t)+' t']].forEach(([id,t])=>{root.querySelector('#'+prefix+id).textContent=t});
 const byState={};for(const r of calc.rows){const k=r.estado+'|'+(r.sentido.startsWith('Exportacion')?'Exportación BR':'Importación BR');if(!byState[k])byState[k]={q:0,rev:0};byState[k].q+=r.toneladas;byState[k].rev+=r.ingresos_usd;}
 const names=Object.keys(byState);const selected=root.querySelector('#'+prefix+'State').value;const keys=names.filter(k=>!selected||k.startsWith(selected+'|'));
 const byPort={};for(const r of calc.rows){if(selected&&r.estado!==selected)continue;const k=r.puerto+' | '+(r.sentido.startsWith('Exportacion')?'Exportación BR':'Importación BR');if(!byPort[k])byPort[k]={q:0,rev:0};byPort[k].q+=r.toneladas;byPort[k].rev+=r.ingresos_usd;}
 root.querySelector('#'+prefix+'Rows').innerHTML='<table class="e2asia-table"><thead><tr><th>Estado y sentido BR</th><th>Captación t</th><th>Ingreso US$ M</th></tr></thead><tbody>'+keys.map(k=>'<tr><td>'+esc(k)+'</td><td>'+fmt(byState[k].q)+'</td><td>'+fmt(byState[k].rev/1e6,3)+'</td></tr>').join('')+'</tbody></table><details><summary style="cursor:pointer;padding:7px 0;color:inherit">Distribución indicativa por puerto: Ilo y Matarani</summary><table class="e2asia-table"><thead><tr><th>Puerto y sentido BR</th><th>Captación t</th><th>Ingreso US$ M</th></tr></thead><tbody>'+Object.entries(byPort).map(([k,v])=>'<tr><td>'+esc(k)+'</td><td>'+fmt(v.q)+'</td><td>'+fmt(v.rev/1e6,3)+'</td></tr>').join('')+'</tbody></table></details>';
 const x=['Cadenas E1','Brasil–Asia','Integrada'];const y=[calc.e1.toneladas,calc.asia_t,calc.total_t];
 if(typeof Plotly!=='undefined')Plotly.react(prefix+'Graph',[{type:'bar',x,y,marker:{color:['#3a86a5','#d3a521','#7eb8a0']},text:y.map(v=>fmt(v)+' t'),textposition:'auto'}],{margin:{t:10,b:46,l:53,r:8},height:245,plot_bgcolor:root.classList.contains('e2asia-lab')?'#f6f8fa':'#24282b',paper_bgcolor:root.classList.contains('e2asia-lab')?'#f6f8fa':'#24282b',font:{color:root.classList.contains('e2asia-lab')?'#24394c':'#f4f4f4',size:11},yaxis:{title:'t/año',gridcolor:'#9ba6aa',rangemode:'tozero'}},{responsive:true,displayModeBar:false});
 }
 function inputs(prefix){const keys=[['Acc','factor_mercado_accesible'],['Pac','factor_preferencia_pacifico'],['Hab','factor_habilitacion'],['Tar','tarifa_factor']];for(const [suffix,k] of keys){const inp=document.getElementById(prefix+suffix);if(!inp)continue;inp.value=params[k];document.getElementById(prefix+'v'+suffix).textContent=fmt(params[k],2)+'×';inp.oninput=()=>{params[k]=Number(inp.value);['e2asiaMarket','e2asiaLab'].forEach(id=>{const inp2=document.getElementById(id+suffix);if(inp2)inp2.value=params[k];const v=document.getElementById(id+'v'+suffix);if(v)v.textContent=fmt(params[k],2)+'×';render(id)})};}
 document.getElementById(prefix+'State').onchange=()=>render(prefix);
 document.getElementById(prefix+'Export').onclick=()=>{const arr=compute().rows;const headers=['estado','sentido','puerto','toneladas','ticket','ingresos_usd','pacifico','juliaca'];const csv=[headers.join(',')].concat(arr.map(x=>headers.map(k=>String(x[k]).replaceAll(',','.')).join(','))).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='CASO_BRASIL_ASIA_VIA_PERU.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
 }
 async function mountMarket(){await load();const main=document.getElementById('content');if(!main)return;const old=document.getElementById('e2asiaMarketRoot');if(old)old.remove();main.insertAdjacentHTML('beforeend',panel('e2asiaMarket',false));inputs('e2asiaMarket');render('e2asiaMarket');}
 async function mountLab(){await load();const lab=document.getElementById('e2labStage');if(!lab)return;const old=document.getElementById('e2asiaLabRoot');if(old)old.remove();const grid=lab.querySelector('.lab-grid');if(grid){const d=document.createElement('div');d.className='lab-panel lab-wide';d.innerHTML=panel('e2asiaLab',true);grid.insertBefore(d,grid.firstChild);}inputs('e2asiaLab');render('e2asiaLab');}
 document.addEventListener('e2:mounted',()=>{mountLab().catch(console.warn)});document.addEventListener('e2:params',()=>{if(data){['e2asiaLab','e2asiaMarket'].forEach(render)}});
 window.E2_ASIA_UI={mountMarket,mountLab,compute:(p,a)=>compute(p,a),getSettings:()=>({...params})};
})();
