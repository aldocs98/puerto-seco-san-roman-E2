'use strict';
/* 22nd parameter controllable in V14; not part of historical 21-dimensional Sobol sample */
(function(){
 const D=window.E2_MOTOR_DATA;
 if(!D)return;
 D.central.factor_uso_almacenaje=1.0;
 if(!D.variables.some(v=>v.key==='factor_uso_almacenaje'))
  D.variables.push({key:'factor_uso_almacenaje',lo:0,hi:1,central:1,unit:'fracción',desc:'Fracción hipotética que utiliza almacenamiento: afecta facturación por depósito y ahorro de depósito sustituido; NO muestreada en Sobol V13'});
})();
