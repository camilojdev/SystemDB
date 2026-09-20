// Puente hacia el Centro de Etiquetas. Mientras esa pantalla no exista,
// estas dos funciones solo informan al usuario. Cuando se construya el
// Centro de Etiquetas (Fase 5), solo hay que reemplazar el CONTENIDO de
// este archivo para conectarlo de verdad a la cola real de impresión —
// nada más en el sistema necesita cambiar.

export function generarEtiquetasAhora(producto, cantidad) {
  alert(
    `El Centro de Etiquetas todavía no está disponible.\n\n` +
    `Cuando esté listo, podrás generar ${cantidad} etiqueta(s) de "${producto.nombre}" directamente desde aquí.`
  )
}

export function agregarEtiquetasACola(producto, cantidad) {
  alert(
    `El Centro de Etiquetas todavía no está disponible.\n\n` +
    `Cuando esté listo, podrás agregar ${cantidad} etiqueta(s) de "${producto.nombre}" a la cola de impresión desde aquí.`
  )
}