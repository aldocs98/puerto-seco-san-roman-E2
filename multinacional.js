/* R13: matrices V3; geography is contextual, not assigned routing. */
let multiLayer, mf={flujo:'EXP',anio:'2025',pais:'PERU',via:'',uf:'',hs:''}, multiLast='';
const priorR13Render=render;
const M=()=>D.multinacional;
const sum=(rows,k='toneladas')=>rows.reduce((s,r)=>s+(Number(r[k])||0),0);
const multiNames={589:'Perú',160:'China',399:'Japón'};
const pick=(id,label,values,value,all=true)=>'<label for="'+id+'">'+label+'</label><select id="'+id+'">'+(all?'<option value="">Todos</option>':'')+values.map(v=>{const a=Array.isArray(v)?v:[v,v];return '<option value="'+esc(a[0])+'" '+(String(a[0])===String(value)?'selected':'')+'>'+esc(a[1])+'</option>'}).join('')+'</select>';
function goMarket(t){tab=t;render()}
render=function(){
 if(multiLayer)map.removeLayer(multiLayer);
 $('.scope').hidden=['bolivia','brasil','sintesis','control'].includes(tab);
 priorR13Render();
 if(tab==='sintesis')overviewR13();
 if(['bolivia','brasil'].includes(tab)){
  if(multiLast!==tab){mf={flujo:'EXP',anio:'2025',pais:tab==='bolivia'?'PERU':'589',via:'',uf:'',hs:''};multiLast=tab}
  multinational();
 }
 if(tab==='control')controlR13();
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
};
function overviewR13(){
 selection=[];$('#detail').hidden=true;
 $('#content').innerHTML='<div class="eyebrow">ENTREGABLE 1</div><h1>Diagnóstico de los<br>cinco mercados</h1><p class="intro">Caracterización de mercados, cadenas, nodos y corredores relevantes para el Puerto Seco de San Román.</p>'+[
 ['Puno: producción y consumo','territorio','Producción territorial, actividad económica y vínculos funcionales a nodos.'],
 ['Comercio exterior regional','flujos','Exportaciones de Puno, instalaciones portuarias, fronteras y transporte ferroviario.'],
 ['Bolivia','bolivia','País comercial, vía declarada y composición HS2. 2025 completo y enero–agosto de 2026 separados.'],
 ['Brasil','brasil','Acre, Rondônia, Mato Grosso y Amazonas. Comercio 2025 por país, vía y partida SH4.'],
 ['Mercado de referencia','cadenas','Cadenas y corredores pertinentes; servicios logísticos asociados.']
 ].map((x,i)=>'<button class="chain profile" onclick="goMarket(\''+x[1]+'\')"><b>'+String(i+1).padStart(2,'0')+' · '+x[0]+'</b><br>'+x[2]+'</button>').join('')+'<h2>Lectura integrada</h2><p>Producción, comercio y transporte describen etapas distintas. Sus magnitudes conservan fuente, período, unidad y universo; no se suman para estimar captación del proyecto.</p><p>Las líneas comerciales y los vínculos funcionales son esquemáticos. Los nodos de Bolivia y Brasil representan infraestructura registrada y no prueban el itinerario de una mercancía.</p><a class="download" href="../E1_Juliaca_Respaldo_R13.xlsx" download>Descargar respaldo Excel</a>';
 fit();$('#mapstatus').textContent='Cinco mercados · capas regionales y módulos multinacionales V3';
}
function multinational(){
 const bo=tab==='bolivia',data=bo?M().bolivia:M().brasil,yearKey=bo?'anio':'ano',hsKey=bo?'hs2':'sh4',viaKey=bo?'via':'cod_via',countryKey=bo?'pais_comercial':'cod_pais';
 const base=data.filter(r=>r.flujo===mf.flujo&&String(r[yearKey])===mf.anio);
 const rows=base.filter(r=>(!mf.pais||String(r[countryKey])===mf.pais)&&(!mf.via||String(r[viaKey])===mf.via)&&(!mf.uf||r.uf===mf.uf)&&(!mf.hs||String(r[hsKey])===mf.hs));
 selection=rows;const total=sum(rows),unit=bo&&mf.flujo==='IMP'?'t brutas':'t netas';
 const uniq=k=>[...new Set(base.map(r=>String(r[k])))].sort();
 const countries=uniq(countryKey).map(v=>[v,bo?v:multiNames[Number(v)]||'País · código Comex '+v]);
 const hscodes=uniq(hsKey).map(v=>[v,bo?v+' · '+(M().hs2[String(v).padStart(2,'0')]||'Capítulo HS2'):'SH4 '+v]);
 $('#detail').hidden=true;
 $('#content').innerHTML='<div class="eyebrow">MERCADO '+(bo?'03 · BOLIVIA':'04 · BRASIL')+'</div><h1>'+ (bo?'Bolivia':'Cuatro estados de Brasil')+'</h1><p class="intro">'+(bo?'Comercio exterior nacional según país y vía declarados.':'Acre · Rondônia · Mato Grosso · Amazonas. Comex Stat 2025.')+'</p>'+pick('mfFlow','SENTIDO DESDE '+(bo?'BOLIVIA':'BRASIL'),[['EXP','Exportación'],['IMP','Importación']],mf.flujo,false)+pick('mfYear','PERÍODO',bo?[['2025','2025 · enero–diciembre'],['2026','2026 · enero–agosto']]:[['2025','2025 · enero–diciembre']],mf.anio,false)+pick('mfCountry','PAÍS COMERCIAL',countries,mf.pais)+(!bo?pick('mfUF','UNIDAD FEDERATIVA',[['AC','Acre'],['RO','Rondônia'],['MT','Mato Grosso'],['AM','Amazonas']],mf.uf):'')+pick('mfVia',bo?'VÍA DECLARADA':'VÍA · CÓDIGO COMEX STAT',uniq(viaKey),mf.via)+pick('mfHS',bo?'CAPÍTULO HS2':'PARTIDA SH4',hscodes,mf.hs)+'<div class="row"><button id="mfReset">Restablecer filtros</button><button id="mfGeo">Descargar nodos GeoJSON</button></div><div class="cards">'+card(fmt(total,3),unit+' · selección')+card(fmt(sum(rows,'usd_fob'),0),'USD FOB · selección')+'</div><p>'+fmt(rows.length)+' grupos estadísticos · '+fmt(sum(rows,'registros'))+' registros de origen</p><div class="note">'+(bo?'Exportación en peso neto e importación en peso bruto. País comercial y vía son dimensiones diferentes. Desaguadero no acredita paso por Juliaca; los nodos cartográficos no reciben asignaciones automáticas de carga.':'Exportación: UF del producto. Importación: UF del domicilio fiscal del importador, no destino físico verificado. China y Japón son referencias parciales de Asia. La vía conserva el código fuente; no identifica por sí sola un corredor terrestre.')+'</div><div id="multiRank" class="plot" style="height:340px"></div><h2>Composición de la selección</h2><div id="multiHS" class="plot" style="height:340px"></div><div id="multiTop"></div><h2>Infraestructura logística</h2><p>'+ (bo?'Localizaciones del directorio de Aduana Nacional. Los plazos regulatorios de tránsito se mantienen separados de los tiempos de viaje.':'Instalaciones portuarias de los cuatro estados. El mapa contextual no asigna los flujos comerciales a estos puertos.')+'</p><button id="multiFit">Encuadrar mapa</button><h2>Matriz filtrada</h2>'+table(rows.slice(0,100),[[countryKey,'País / código'],[bo?'via':'uf',bo?'Vía':'UF'],[hsKey,bo?'HS2':'SH4'],['toneladas',unit],['usd_fob','USD FOB']])+'<p class="intro">Fuente: '+esc(M().fuente)+'.</p>';
 const bindings={mfFlow:'flujo',mfYear:'anio',mfCountry:'pais',mfVia:'via',mfHS:'hs',mfUF:'uf'};
 for(const [id,k] of Object.entries(bindings)){const e=$('#'+id);if(e)e.onchange=()=>{mf[k]=e.value;if(['flujo','anio'].includes(k)){mf.via='';mf.hs=''}multinational()}}
 $('#mfReset').onclick=()=>{mf={flujo:'EXP',anio:'2025',pais:bo?'PERU':'589',via:'',uf:'',hs:''};multinational()};
 const ranks=group(rows,bo?'via':'uf','toneladas');plot('multiRank',ranks.slice(0,12),'name','value',bo?'Vías declaradas · selección':'Unidades federativas · selección',unit);
 const products=group(rows,hsKey,'toneladas');plot('multiHS',products.slice(0,10),'name','value',bo?'Composición por HS2':'Composición por SH4',unit);
 const top=products.slice(0,3).map(r=>({producto:(bo?'HS2 ':'SH4 ')+r.name,toneladas:r.value,participacion:total?100*r.value/total:0}));
 $('#multiTop').innerHTML=table(top,[['producto','Tres principales'],['toneladas',unit],['participacion','% de la selección']])+'<p class="intro">Denominador: '+fmt(total,3)+' '+unit+' del mismo sentido, período y filtros. No es participación en la demanda capturable.</p>';
 if(multiLayer)map.removeLayer(multiLayer);multiLayer=L.featureGroup();const nodes=(bo?M().bol_nodos:M().br_nodos).filter(r=>!mf.uf||r.uf===mf.uf);
 for(const r of nodes){const lat=Number(r.lat),lon=Number(r.lon);if(r.lat==null||r.lon==null||!Number.isFinite(lat)||!Number.isFinite(lon))continue;
  L.circleMarker([lat,lon],{radius:6,color:'#292929',weight:1.5,fillColor:'#FFC000',fillOpacity:.9}).addTo(multiLayer).bindTooltip(esc(r.oficina||r.nombre)).on('click',()=>detail(r.oficina||r.nombre,table(Object.entries(r).map(([campo,valor])=>({campo,valor})),[['campo','Atributo'],['valor','Registro']])+'<p class="note">Localización de infraestructura. Sin asignación de los tonelajes de esta selección al nodo.</p>'));
 }
 multiLayer.addTo(map);const frame=()=>{if(multiLayer.getLayers().length)map.fitBounds(multiLayer.getBounds(),{padding:[40,40],maxZoom:7})};$('#multiFit').onclick=frame;frame();
 $('#mfGeo').onclick=()=>downloadJSON(nodesGeoJSON(nodes),'E1_'+tab+'_nodos_V3.geojson','application/geo+json');
 $('#mapstatus').textContent='● Nodos registrados · sin asignación de carga ni ruta comercial';
}
function nodesGeoJSON(rows){return {type:'FeatureCollection',features:rows.filter(r=>r.lat!=null&&r.lon!=null&&Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lon))).map(r=>({type:'Feature',geometry:{type:'Point',coordinates:[Number(r.lon),Number(r.lat)]},properties:r}))}}
function downloadJSON(obj,name,type='application/json'){const u=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function exportSelection(){downloadJSON({version:'R13',base:'V3',vista:tab,filtros:['bolivia','brasil'].includes(tab)?mf:{region},registros:selection},'E1_'+tab+'_seleccion.json')}
const oldFitR13=$('#fit').onclick;$('#fit').onclick=()=>['bolivia','brasil'].includes(tab)?$('#multiFit')?.click():oldFitR13();
function controlR13(){
 selection=[];
 $('#content').innerHTML='<div class="eyebrow">FUENTES</div><h1>Información del estudio</h1><h2>Perú</h2><p>Producción: MIDAGRI y MINEM. Comercio exterior regional: MINCETUR. Puertos: Autoridad Portuaria Nacional. Infraestructura y corredores: MTC y PNSILT.</p><h2>Bolivia</h2><p>Comercio exterior y aduanas: fuentes institucionales bolivianas integradas en el estudio. Red vial: Administradora Boliviana de Carreteras. Indicadores territoriales: archivos GIS del estudio.</p><h2>Brasil</h2><p>Comercio exterior: MDIC, Comex Stat. Puertos e hidrovías: ANTAQ y fuentes cartográficas institucionales. Los atributos territoriales conservan el período y la unidad de su registro de origen.</p><h2>Cartografía base</h2><p>© OpenStreetMap contributors. Las capas temáticas presentan su fuente, período y unidad en cada vista.</p>';
}
