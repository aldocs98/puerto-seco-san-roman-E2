'use strict';
/* E2: hexagono paramétrico. Sin cambios en app.js, style.css, extension.js o datos.json del WebGIS. */
(function(){
 const defaults=['escala_logit_usd_t','factor_servicios_opcionales','prob_base_media','capacidad_t_anio','horas_espera_operativa_actual','fraccion_espera_operativa_evitada'];
 const short={fraccion_doble_manipulacion_importacion:'Salida almacén imp.',factor_tarifas_referencia:'Tarifa',factor_servicios_opcionales:'Servicios',fraccion_almacenaje_sustituible:'Almacenaje sustituible',costo_actual_almacenaje_usd_t:'Gasto almac. actual',fraccion_espera_operativa_evitada:'Tiempo evitable',horas_espera_operativa_actual:'Espera actual',costo_actual_distribucion_usd_t:'Distrib. actual',beneficio_distribucion_usd_t:'Distribución',prob_base_alta:'Preferencia Alta',prob_base_media:'Preferencia Media',prob_base_condicional:'Preferencia Cond.',disponibilidad_recinto:'Habilitación',escala_logit_usd_t:'Escala Logit',capacidad_t_anio:'Capacidad',factor_CG_ruta:'Δ costo vial',dias_importacion:'Días imp.',dias_exportacion:'Días exp.',dias_transito:'Días tránsito',beneficio_seguridad_recinto_usd_t:'Seguridad recinto',costo_manipulacion_adicional_usd_t:'Manipul. extra',peso_por_operacion_t:'Peso/operación',ahorro_documentacion_usd_t:'Ahorro docs.',factor_valor_aduanero_proxy:'Valor carga',dias_espera_evitados:'Días evitados',valor_dia_espera_usd_t:'Valor espera',fx_brl_usd:'BRL/USD',costo_acceso_brasil_usd_t:'Acceso Brasil'};
 let axes=defaults.slice(),active=-1,instance=0,ref=null;
 const ns='http://www.w3.org/2000/svg',cx=166,cy=159,R=95;
 const escapeHTML=str=>String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const fmt=(x)=>Number(x).toLocaleString('es-PE',{maximumFractionDigits:2});
 function label(v){return short[v.key]||v.key.replace(/_/g,' ').slice(0,17)}
 function xy(i,u){const ang=-Math.PI/2+i*Math.PI/3;return [cx+Math.cos(ang)*R*u,cy+Math.sin(ang)*R*u];}
 function poly(values){return values.map((v,i)=>xy(i,v).map(x=>x.toFixed(1)).join(',')).join(' ')}
 function getAPI(){return window.E2_ECONOMIC_UI}
 function getVar(k){return getAPI()?.getVariables().find(v=>v.key===k)}
 function uvalue(k,p){const v=getVar(k);if(!v||v.hi===v.lo)return .5;return clamp(((p[k]??v.central)-v.lo)/(v.hi-v.lo),0,1)}
 function values(p){return axes.map(k=>uvalue(k,p))}
 function markup(){const api=getAPI(),vars=api.getVariables();let opts=vars.map(v=>`<option value="${escapeHTML(v.key)}">${escapeHTML(label(v))}</option>`).join('');
 return `<section class="e2-radar-panel"><div class="e2-radar-top"><b>Polígono controlador · 6 controles prioritarios</b><span>Modelo económico integral</span></div>
 <p class="e2-radar-help">Arrastra un vértice. Los seis ejes son configurables con cualquiera de los ${vars.length} parámetros del motor. Los ejes iniciales muestran las seis variables más asociadas a captación en el barrido multivariable: sensibilidad de elección, servicios, propensión, capacidad y tiempo. No todas son palancas comerciales. El gráfico muestra el <b>porcentaje de su rango de ensayo</b>, no de competitividad.</p>
 <svg id="e2-radar-svg" viewBox="0 0 332 324" role="img" aria-label="Hexágono interactivo de parámetros con seis vértices arrastrables"></svg>
 <div class="e2-radar-axis" id="e2-radar-axis">${axes.map((k,i)=>`<div class="e2-axis-line"><label> Eje ${i+1} <select data-axis="${i}" aria-label="Parámetro del eje ${i+1}">${opts}</select></label><output data-value="${i}"></output></div>`).join('')}</div>
 <p id="e2-param-selected-description" class="e2-radar-selected" aria-live="polite"></p>
 <div class="e2-radar-compare" id="e2-radar-compare" aria-live="polite"></div>
 <details class="e2-param-diccionario" id="e2-param-diccionario"><summary>Diccionario de 34 parámetros: descripción, rango y evidencia</summary>
 <p class="e2-radar-help">Las referencias describen supuestos de simulación; no son coeficientes estimados con entrevistas. Los cambios del hexágono recalculan el motor y no sustituyen las restricciones operativas.</p>
 <input class="e2-param-buscar" id="e2-param-buscar" type="search" aria-label="Buscar variable" placeholder="Buscar variable o descripción…">
 <div class="e2-param-tabla-wrap"><table class="e2-param-tabla"><thead><tr><th>Variable</th><th>Función</th><th>Rango de ensayo</th><th>Origen</th></tr></thead><tbody id="e2-param-tabla-body"></tbody></table></div>
 </details>
 <p class="e2-radar-foot">Gris: referencia. Amarillo: escenario actual. Un vértice más alejado significa <b>mayor valor del parámetro</b>, no necesariamente mejores resultados. La evaluación final aplica las 41 fichas y las mismas fórmulas de Python.</p>
 <button id="e2-radar-reset" type="button">Restaurar hexágono de referencia</button></section>`;}
 function svgElement(tag,attrs){const s=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))s.setAttribute(k,String(v));return s;}
 function render(){const svg=document.getElementById('e2-radar-svg'),api=getAPI();if(!svg||!api)return;const p=api.getParams(),uv=values(p),rv=values(ref||p);svg.innerHTML='';
 const add=(tag,attrs)=>{let n=svgElement(tag,attrs);svg.appendChild(n);return n;};
 for(let z=1;z<=4;z++)add('polygon',{points:poly(Array(6).fill(z/4)),fill:'none',stroke:z===4?'#8b9ba7':'#50606e','stroke-width':z===4?1.3:.7,'stroke-dasharray':z===4?'':'3 4'});
 axes.forEach((k,i)=>{const end=xy(i,1),outer=xy(i,1.18),v=getVar(k);add('line',{x1:cx,y1:cy,x2:end[0],y2:end[1],stroke:'#667b8a','stroke-width':1});
 const lbl=add('text',{x:outer[0],y:outer[1],fill:'#dce5eb','font-size':10,'font-weight':600,'text-anchor':i===0||i===3?'middle':i===1||i===2?'start':'end'});lbl.textContent=label(v);});
 add('polygon',{points:poly(rv),fill:'rgba(180,191,203,.13)',stroke:'#a5b1c2','stroke-width':2,'stroke-dasharray':'4 4'});
 add('polygon',{points:poly(uv),fill:'rgba(252,194,38,.30)',stroke:'#ffd044','stroke-width':2.3});
 axes.forEach((k,i)=>{const pt=xy(i,uv[i]);add('circle',{cx:pt[0],cy:pt[1],r:active===i?9:7,fill:'#ffd24d',stroke:'#162632','stroke-width':2,'data-index':i,style:'cursor:grab'});});
 document.querySelectorAll('[data-value]').forEach(o=>{let i=+o.dataset.value,k=axes[i],v=getVar(k);o.textContent=fmt(p[k])+' '+(v?.unit||'')+' · '+Math.round(uv[i]*100)+'%';});
 const base=getAPI().evaluate(ref||p).out,cur=getAPI().evaluate(p).out;const pp=(n,unit)=>n>=0?'+'+fmt(n)+unit:fmt(n)+unit;
 const selected=document.getElementById('e2-param-selected-description');if(selected){const pick=axes.map(k=>window.E2_PARAMETER_DICTIONARY?.[k]?.descripcion||getVar(k)?.desc||'').filter(Boolean);selected.textContent='Ejes seleccionados: '+pick.join(' · ');} 
 const comp=document.getElementById('e2-radar-compare');if(comp)comp.innerHTML=`<div><small>Δ captación</small><strong>${pp(cur.toneladas-base.toneladas,' t')}</strong></div><div><small>Δ ingresos</small><strong>${pp((cur.ingresos_usd-base.ingresos_usd)/1e6,' M USD')}</strong></div><div><small>Ticket actual</small><strong>${fmt(cur.ticket_usd_t)} USD/t</strong></div>`;
 }

 function renderDictionary(){
  const body=document.getElementById('e2-param-tabla-body');if(!body)return;
  const items=window.E2_PARAMETER_DICTIONARY||{};
  const query=(document.getElementById('e2-param-buscar')?.value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const normalize=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  body.innerHTML=Object.entries(items).filter(([k,v])=>!query||normalize(k+' '+v.descripcion+' '+v.bloque).includes(query)).map(([k,v])=>{
   const fmt1=n=>Number(n).toLocaleString('es-PE',{maximumFractionDigits:5});
   return `<tr><td><b>${escapeHTML(k.replaceAll('_',' '))}</b></td><td>${escapeHTML(v.descripcion)}<small>${escapeHTML(v.precaucion)}</small></td><td>${fmt1(v.min)} – ${fmt1(v.max)}<br><small>Ref. ${fmt1(v.ref)} ${escapeHTML(v.unidad)}</small></td><td>${escapeHTML(v.naturaleza)}<small>${escapeHTML(v.estado)}</small></td></tr>`;
  }).join('');
 }
 function mount(){const host=document.getElementById('e2RadarHost');if(!host||!getAPI()?.getVariables)return;if(host.dataset.ready==='1')return;
 host.innerHTML=markup();host.dataset.ready='1';ref={...window.E2_MOTOR_DATA.central};const api=getAPI();
 host.querySelectorAll('[data-axis]').forEach((sel,i)=>{sel.value=axes[i];sel.onchange=()=>{axes[i]=sel.value;render()}});
 host.querySelector('#e2-radar-reset').onclick=()=>{api.setParams(ref);render()};
 const svg=host.querySelector('svg');
 function setFromPointer(e){if(active<0)return;const key=axes[active],v=getVar(key);if(!v)return;const inv=svg.getScreenCTM()?.inverse();if(!inv)return;let pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;pt=pt.matrixTransform(inv);let unit=xy(active,1),dx=unit[0]-cx,dy=unit[1]-cy;
 const normalized=clamp(((pt.x-cx)*dx+(pt.y-cy)*dy)/(R*R),0,1);const val=v.lo+normalized*(v.hi-v.lo);
 const p={...api.getParams(),[key]:val};api.previewParams(p);render();}
 svg.addEventListener('pointerdown',e=>{const i=e.target.dataset.index;if(i===undefined)return;active=Number(i);svg.setPointerCapture(e.pointerId);setFromPointer(e);e.preventDefault()});
 svg.addEventListener('pointermove',e=>{if(active!==-1)setFromPointer(e)});
 function finish(){if(active<0)return;active=-1;api.setParams(api.getParams());render()}
 svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);
 document.addEventListener('e2:params',render);
 host.querySelectorAll('select').forEach(el=>{el.style.background='#fff'});
 renderDictionary();host.querySelector('#e2-param-buscar')?.addEventListener('input',renderDictionary);
 render();}
 document.addEventListener('e2:mounted',mount);
 if(document.getElementById('e2RadarHost'))mount();
 // Standalone and map may be remounted: a new host is created and event fires.
})();
