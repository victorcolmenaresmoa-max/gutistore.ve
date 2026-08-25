import { Product } from '@/types';

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    nombre: 'Creatina Monohidratada Premium',
    descripcion:
      'Creatina micronizada de alta pureza para acompañar rutinas de fuerza, potencia y rendimiento físico. Una fórmula simple, versátil y fácil de integrar a tu día.',
    precio: 32,
    categoria: 'Rendimiento',
    imagen:
      'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1200&auto=format&fit=crop',
    stock: 25,
    presentacion: '300 g · 60 porciones',
    beneficios:
      'Apoya el desempeño en entrenamientos intensos\nComplementa objetivos de fuerza y potencia\nFórmula sin sabores añadidos',
    modoUso:
      'Mezclar una porción con agua o tu bebida preferida. Sigue siempre las indicaciones de la etiqueta del producto.',
    ingredientes: 'Creatina monohidratada micronizada.',
    destacado: true,
  },
  {
    id: 'demo-2',
    nombre: 'Whey Protein Isolate',
    descripcion:
      'Aislado de proteína de suero con textura ligera y excelente solubilidad. Diseñado para complementar la ingesta diaria de proteína de forma práctica.',
    precio: 54,
    categoria: 'Proteína',
    imagen:
      'https://images.unsplash.com/photo-1579722821273-0f6c1b5d0d0a?q=80&w=1200&auto=format&fit=crop',
    stock: 18,
    presentacion: '2 lb · 28 porciones',
    beneficios:
      'Alternativa práctica para complementar proteína\nIdeal después del entrenamiento o entre comidas\nPreparación rápida y fácil',
    modoUso:
      'Mezclar una porción con agua o leche según preferencia. Ajusta el consumo a tus necesidades nutricionales.',
    ingredientes: 'Aislado de proteína de suero y saborizantes.',
    destacado: true,
  },
  {
    id: 'demo-3',
    nombre: 'Mass Gainer Balanced Formula',
    descripcion:
      'Mezcla de proteína y carbohidratos pensada para quienes desean aumentar su consumo calórico diario de manera práctica y controlada.',
    precio: 47,
    categoria: 'Volumen',
    imagen:
      'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=1200&auto=format&fit=crop',
    stock: 12,
    presentacion: '5 lb · 16 porciones',
    beneficios:
      'Aporta calorías de forma conveniente\nCombina carbohidratos y proteína\nÚtil para planes orientados a ganancia de masa',
    modoUso:
      'Preparar según la porción indicada en la etiqueta. Puede dividirse en tomas más pequeñas durante el día.',
    ingredientes: 'Mezcla de carbohidratos, concentrado de proteína de suero y saborizantes.',
    destacado: false,
  },
];
