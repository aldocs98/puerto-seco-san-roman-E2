'use strict';
(function(){
const D=window.E2_MOTOR_DATA;
function evaluate(p){
 const r=D.tarifas, REG=D.regs, FC=D.famcoef, F=D.families;
 let out={toneladas:0,ingresos_usd:0,toneladas_margen_positivo:0,importacion_t:0,exportacion_t:0,transito_t:0,brasil_peru_t:0,ingreso_importacion_usd:0,ingreso_exportacion_usd:0,elegibles_t:0,ingresos_con_beneficio_no_negativo_usd:0,brecha_economica_total_usd:0};
 const records=[];
 for(const f of D.profiles){
  const fam=F[f.familia],rr=REG[f.regimen],coeff=FC[f.familia];
  const days=f.regimen==='EXPORTACION'?p.dias_exportacion:f.regimen==='TRANSITO'?p.dias_transito:p.dias_importacion;
  const cycle=f.regimen==='EXPORTACION'?30:10;
  const ncycle=Math.max(1,Math.ceil(days/cycle));
  const val=f.valor_proxy_usd_t*p.factor_valor_aduanero_proxy;
  const factorAlm=p.factor_uso_almacenaje??1;
  const storage=fam.alm*val*(r.alm_ciclo1_pct+r.alm_ciclo2_pct*(ncycle-1))*factorAlm;
  const movement=r.movimiento_brl_t/p.fx_brl_usd;
  const weigh=r.pesaje_brl_veh*2/(p.peso_por_operacion_t*p.fx_brl_usd);
  const fact=p.factor_servicios_opcionales/(p.peso_por_operacion_t*p.fx_brl_usd);
  const unload=r.descarga_brl_evento*fam.descarga*fact;
  const doc=r.documentacion_brl_proceso*fam.documento*fact;
  const insp=r.inspeccion_brl_BL*fam.inspection*fact;
  const decon=r.desconsolidacion_brl_BL*fam.deconsol*fact;
  const handle=r.handling_brl_mov*2*fam.contenedor*fact;
  const salida=f.regimen==='IMPORTACION'?Math.min(unload*(p.fraccion_doble_manipulacion_importacion??0.85),r.descarga_brl_evento*fam.alm*p.factor_servicios_opcionales/(p.peso_por_operacion_t*p.fx_brl_usd))*factorAlm:0;
  const ticket=(storage+movement+weigh+unload+salida+doc+insp+decon+handle)*p.factor_tarifas_referencia;
  // Contrafactual por conceptos con igual ecuación que Python: costos vigentes y fracciones sustituidas.
  const current={
   almacenaje:rr[0]*coeff[0]*fam.alm*p.costo_actual_almacenaje_usd_t*factorAlm,
   documentacion:rr[1]*p.costo_actual_documentacion_usd_t,
   espera:rr[2]*p.horas_espera_operativa_actual*p.costo_camion_por_hora_usd/p.peso_por_operacion_t,
   inventario:rr[2]*val*p.tasa_anual_inventario*p.horas_espera_operativa_actual/8760,
   levante_inv:(f.regimen==='IMPORTACION'&&String(f.ruta_sin).includes('Desaguadero'))?rr[2]*val*p.tasa_anual_inventario*p.horas_levante_referencia/8760:0,
   riesgo:rr[3]*val*p.prob_incidente_actual*p.severidad_incidente_valor,
   distribucion:rr[4]*coeff[1]*p.costo_actual_distribucion_usd_t
  };
  const benefitParts={
   almacenaje:current.almacenaje*p.fraccion_almacenaje_sustituible,
   documentacion:current.documentacion*p.fraccion_documentacion_sustituible,
   tiempo_camion:current.espera*p.fraccion_espera_operativa_evitada,
   inventario:current.inventario*p.fraccion_espera_operativa_evitada+current.levante_inv*p.fraccion_levante_trasladable,
   riesgo:current.riesgo*p.fraccion_riesgo_reducido,
   distribucion:current.distribucion*p.fraccion_distribucion_sustituible
  };
  const sav=Object.values(benefitParts).reduce((a,b)=>a+b,0);
  const extra=rr[5]*coeff[2]*p.costo_manipulacion_adicional_usd_t+rr[6]*p.costo_acceso_brasil_usd_t;
  const delta=(f.CG_con_usd_t-f.CG_sin_usd_t)*p.factor_CG_ruta;
  const operCurrent=Object.values(current).reduce((a,b)=>a+b,0);
  const costoActualComparable=f.CG_sin_usd_t*p.factor_CG_ruta+operCurrent;
  const costoJuliacaComparable=f.CG_con_usd_t*p.factor_CG_ruta+operCurrent-sav+ticket+extra;
  const margin=costoActualComparable-costoJuliacaComparable;
  const priorKey=f.franja==='Alta'?'prob_base_alta':f.franja==='Media'?'prob_base_media':'prob_base_condicional';
  const p0=Math.max(0.00001,Math.min(.99999,p[priorKey]));
  const u=Math.log(p0/(1-p0))+margin/p.escala_logit_usd_t;
  const prob=1/(1+Math.exp(-Math.max(-50,Math.min(50,u))));
  const av=f.Q2028_t*f.eligibilidad*p.disponibilidad_recinto;
  const q=av*prob;
  const rev=q*ticket;
  const costoActualProxy=costoActualComparable;
  const costoConProxy=costoJuliacaComparable;
  out.toneladas+=q;out.ingresos_usd+=rev;out.elegibles_t+=av;
  if(margin>=0){out.toneladas_margen_positivo+=q;out.ingresos_con_beneficio_no_negativo_usd+=rev;}
  out.brecha_economica_total_usd+=q*Math.max(0,-margin);
  const key={'IMPORTACION':'importacion_t','EXPORTACION':'exportacion_t','TRANSITO':'transito_t','BRASIL_PERU':'brasil_peru_t'}[f.regimen];
  if(key)out[key]+=q;
  if(f.regimen==='IMPORTACION')out.ingreso_importacion_usd+=rev;
  if(f.regimen==='EXPORTACION')out.ingreso_exportacion_usd+=rev;
  records.push({...f,costo_actual_proxy_usd_t:costoActualProxy,costo_con_juliaca_proxy_usd_t:costoConProxy,current,benefitParts,days,ciclos:Math.ceil(days/cycle),inventario_t:q*days/365,margin,prob,p0,ticket,save:sav,extra,delta,ahorro_adicional_requerido_usd_t:Math.max(0,-margin),tarifa_maxima_sin_sobrecosto_usd_t:sav-extra-delta,captacion_t:q,ingresos_usd:rev,operaciones:{almacenamiento:storage,movimiento:movement,pesaje:weigh,descarga:unload,carga_salida:salida,documentos:doc,inspeccion:insp,desconsolidacion:decon,handling:handle}});
 }
 const cap=Math.min(1,p.capacidad_t_anio/Math.max(1e-9,out.toneladas));
 for(const k in out)if(k!=='elegibles_t')out[k]*=cap;
 for(const x of records){x.captacion_t*=cap;x.ingresos_usd*=cap;x.inventario_t*=cap;}
 out.ticket_usd_t=out.toneladas?out.ingresos_usd/out.toneladas:0;
 out.ticket_importacion_usd_t=out.importacion_t?out.ingreso_importacion_usd/out.importacion_t:0;
 out.ticket_exportacion_usd_t=out.exportacion_t?out.ingreso_exportacion_usd/out.exportacion_t:0;
 out.brecha_economica_media_usd_t=out.toneladas?out.brecha_economica_total_usd/out.toneladas:0;
 out.fraccion_margen_positivo=out.toneladas?out.toneladas_margen_positivo/out.toneladas:0;
 return {out,records};
}
window.E2_ENGINE_CALC={evaluate};
})();
