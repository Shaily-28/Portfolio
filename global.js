console.log("IT'S ALIVE!")
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
} 
