"use strict";
// Extensión E2 montada sobre los componentes originales E1 (mapa, estilos, herramientas, menús).
(function(){
 let payload={}, overlays=[], current="";
 const fmt=(n,d=0)=>Number(n||0).toLocaleString('es-PE',{minimumFractionDigits:d,maximumFractionDigits:d});
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const el=()=>document.querySelector('#content');
 const dbl=(o,k)=>parseFloat(o[k]||0);
 const active=t=>t.startsWith('e2_');
 function clear(){overlays.forEach(x=>{if(map.hasLayer(x))map.removeLayer(x)});overlays=[]}
 async function load(){if(Object.keys(payload).length)return;const files=['14_CADENAS_E1_E2','RUTAS_CG_UNIFICADO_V6','BRASIL_ASIA_ESTADO_PUERTO'];await Promise.all(files.map(async x=>{payload[x]=await(await fetch('e2/data/'+x+'.json')).json()}));}
 async function layer(file,style,popup){const o=await(await fetch('e2/capas/'+file+'.geojson')).json();let l=L.geoJSON(o,{style, onEachFeature:(f,n)=>n.bindPopup(popup(f.properties))}).addTo(map);overlays.push(l);map.fitBounds(l.getBounds(),{padding:[30,35]})}
 const top=(h,intro)=>'<div class="eyebrow">PERFIL DE DEMANDA · E2</div><h1>'+h+'</h1><p class="intro">'+intro+'</p>';
 async function render(t){await load();clear();current=t;
 if(t==='e2_perfil'){
 let rows=payload['14_CADENAS_E1_E2'];
 const engine=window.E2_ENGINE_CALC,model=window.E2_MOTOR_DATA;
 const cur=engine&&model?engine.evaluate({...model.central,...(window.E2_ECONOMIC_UI?.getParams?.()||{})}):null;
 const chainMap=new Map();if(cur){for(const r of cur.records){const v=chainMap.get(r.id)||{q:0,revenue:0};v.q+=r.captacion_t;v.revenue+=r.ingresos_usd;chainMap.set(r.id,v)}}
 el().innerHTML=top('Mercados, cadenas y servicios','Mercado de las 14 cadenas del E1, con captación e ingreso de ensayo calculados exclusivamente por el motor económico actual. Los resultados corresponden al motor único de evaluación económica.')+
 '<div class="e2well"><b>Mercado base E1:</b> 2.819.000 t (suma de P50 de cadenas)'+(cur?' · <b>Captación actual:</b> '+fmt(cur.out.toneladas)+' t · <b>Ingreso bruto:</b> US$ '+fmt(cur.out.ingresos_usd/1e6,2)+' M':' · Revisar la pestaña 12 para el cálculo del motor')+'</div>'+
 rows.map(r=>{let id=r.id_cadena||r.ID||r.id||r.cadena||'';let a=chainMap.get(id);return '<div class="e2row"><b>'+safe(id)+'</b> · '+safe(r.MERCADO||r.mercado||r.Cadena||r.mercado_e1||'')+'<div class="e2small">Base E1: '+fmt(r.p50_e1_2025_t_proxy)+' t'+(a?' · Captación del modelo: '+fmt(a.q)+' t · Ticket del modelo: '+fmt(a.q?a.revenue/a.q:0,2)+' USD/t':' · Sin valor de motor asociado')+'</div></div>'}).join('');
 await layer('quinua_provincial_poligonos',f=>({color:'#aa783b',weight:1,fillColor:f.properties?.quinua_t>3000?'#be7d00':'#f4dd9a',fillOpacity:.6}),p=>'<b>'+safe(p.provincia)+'</b><br>Quinua indicativa 2025: '+fmt(p.quinua_t,0)+' t<br>No constituye OD de carga observada.');
 }else if(t==='e2_rutas'){
 let rows=payload['RUTAS_CG_UNIFICADO_V6'];el().innerHTML=top('Rutas y costos generalizados','Costos de circulación modelados por sentido, para camión de cinco ejes y carga neta de 25 t. El costo generalizado de la red ya incluye peajes.')+'<div class="e2well"><b>Iñapari → Juliaca</b><p>789,367 km · R$ 5.482,72 por camión · US$ 42,17/t. La comparación puerta a puerta agrega accesos y servicios según cada cadena.</p></div><label>Seleccionar recorrido</label><select class="e2select" id="e2route">'+rows.map(r=>'<option value="'+safe(r.id)+'">'+safe(r.origen)+' → '+safe(r.destino)+'</option>').join('')+'</select><div id="e2routeinfo"></div>';
 const sel=document.getElementById('e2route');const draw=async()=>{clear();let r=rows.find(x=>x.id===sel.value);document.querySelector('#e2routeinfo').innerHTML='<div class="e2row"><b>'+safe(r.origen)+' → '+safe(r.destino)+'</b><br>Distancia: '+fmt(r.km,3)+' km<br>CG: R$ '+fmt(r.cg_brl_camion_5e,2)+'/camión · US$ '+fmt(r.cg_usd_t_5e_25t_tc5_2,2)+'/t<br>Peaje contenido en CG: R$ '+fmt(r.peaje_incluido_brl_5e,2)+'/camión</div>'; const data=await(await fetch('e2/capas/rutas_modelo_v6.geojson')).json();const fs=data.features.filter(f=>f.properties.id===r.id);if(fs.length){let ll=L.geoJSON({type:'FeatureCollection',features:fs},{style:{color:'#cb8a14',weight:5}}).addTo(map);overlays.push(ll);map.fitBounds(ll.getBounds(),{padding:[35,35]});}};sel.onchange=draw;await draw();
 }else if(t==='e2_mercados'){
 const rows=payload['BRASIL_ASIA_ESTADO_PUERTO'];const unique=new Map();
 for(const r of rows){const k=r.estado+'|'+r.sentido;if(!unique.has(k))unique.set(k,r)}
 const states=[...new Set([...unique.values()].map(r=>r.estado))];
 const ref=(s,needle)=>{const x=[...unique.values()].find(r=>r.estado===s&&r.sentido.includes(needle));return x?dbl(x,'referencia_e1_2025_t'):0};
 el().innerHTML=top('Brasil–Asia · mercado de referencia','Comercio 2025 con China y Japón por estado y sentido, seguido de un escenario condicionado de tránsito vía Perú. El comercio es una base de mercado, no un volumen observado por Juliaca; la elección de corredor y puerto es una hipótesis explícita.')+
 '<div class="e2well"><b>Alcance:</b> comercio de referencia E1 y oportunidad Brasil–Asia vía Perú. <b>Captación E1:</b> independiente. <b>Caso internacional condicionado:</b> calculado más abajo y limitado por la capacidad remanente.</div>'+
 states.map(s=>'<div class="e2row"><b>'+safe(s)+'</b><div class="e2num">Exportación hacia Asia: '+fmt(ref(s,'Exportacion'))+' t</div><div class="e2small">Importación desde Asia: '+fmt(ref(s,'Importacion'))+' t · Base 2025. No supone tránsito por Juliaca ni migración hacia el Pacífico.</div></div>').join('');
 await layer('BR_ESTADOS_AREA_ESTUDIO',{color:'#9f8c64',weight:1,fillColor:'#eab844',fillOpacity:.42},p=>'<b>'+safe(p.NomeUF)+'</b><br>Referencia de comercio E1 / Comex Stat');
 if(window.E2_ASIA_UI)await window.E2_ASIA_UI.mountMarket();

 }
 }
 document.querySelectorAll('nav button').forEach(b=>{b.addEventListener('click',()=>{let t=b.dataset.tab;if(active(t)){render(t).catch(e=>{el().innerHTML='<p>No se puede cargar módulo E2: '+safe(e.message)+'</p>';console.error(e)})}else clear()})});
})();
